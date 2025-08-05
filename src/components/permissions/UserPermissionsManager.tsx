import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, User } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Module {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
}

interface UserPermission {
  user_id: string;
  module_id: string;
  can_access: boolean;
  has_custom_permission: boolean;
  is_allowed: boolean;
}

export function UserPermissionsManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .neq("role", "admin_master")
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from("system_modules")
        .select("id, name, title, icon, description")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos",
        variant: "destructive",
      });
    }
  };

  const loadUserPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_user_allowed_modules", {
        target_user_id: userId,
      });

      if (error) throw error;

      const permissionsData = data.map((item: any) => ({
        user_id: userId,
        module_id: modules.find((m) => m.name === item.module_name)?.id || "",
        can_access: item.is_allowed,
        has_custom_permission: item.has_custom_permission,
        is_allowed: item.is_allowed,
      }));

      setPermissions(permissionsData);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleId: string, canAccess: boolean) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.module_id === moduleId
          ? { ...perm, can_access: canAccess, has_custom_permission: true }
          : perm
      )
    );
  };

  const resetToDefault = async (moduleId: string) => {
    if (!selectedUser) return;

    try {
      // Remover permissão customizada
      const { error } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUser.id)
        .eq("module_id", moduleId);

      if (error) throw error;

      // Recarregar permissões
      await loadUserPermissions(selectedUser.id);

      toast({
        title: "Sucesso",
        description: "Permissão restaurada para o padrão do role",
      });
    } catch (error) {
      console.error("Erro ao resetar permissão:", error);
      toast({
        title: "Erro",
        description: "Erro ao resetar permissão",
        variant: "destructive",
      });
    }
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const customPermissions = permissions.filter((perm) => perm.has_custom_permission);

      for (const perm of customPermissions) {
        const { error } = await supabase
          .from("user_permissions")
          .upsert({
            user_id: selectedUser.id,
            module_id: perm.module_id,
            can_access: perm.can_access,
            granted_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Permissões salvas com sucesso",
      });

      // Recarregar permissões
      await loadUserPermissions(selectedUser.id);
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "gestor":
        return "bg-blue-100 text-blue-800";
      case "admin_cliente":
        return "bg-purple-100 text-purple-800";
      case "tecnico":
        return "bg-green-100 text-green-800";
      case "cliente":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Permissões</h2>
        <p className="text-muted-foreground">
          Configure quais módulos cada usuário pode acessar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Selecione um usuário para editar permissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissões do Usuário */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedUser ? `Permissões - ${selectedUser.name}` : "Selecione um usuário"}
            </CardTitle>
            <CardDescription>
              {selectedUser
                ? "Configure os módulos que este usuário pode acessar"
                : "Escolha um usuário na lista ao lado para configurar suas permissões"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Carregando permissões...</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {modules.map((module) => {
                        const permission = permissions.find((p) => p.module_id === module.id);
                        const isCustom = permission?.has_custom_permission || false;

                        return (
                          <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Label className="font-medium">{module.title}</Label>
                                {isCustom && (
                                  <Badge variant="outline" className="text-xs">
                                    Customizado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={permission?.can_access || false}
                                onCheckedChange={(checked) =>
                                  togglePermission(module.id, checked)
                                }
                              />
                              {isCustom && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resetToDefault(module.id)}
                                  title="Restaurar para padrão do role"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button onClick={savePermissions} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Salvando..." : "Salvar Permissões"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione um usuário para configurar suas permissões
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}