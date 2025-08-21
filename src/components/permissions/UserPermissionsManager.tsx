
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
  company_id: string;
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
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUserRole();
    loadUsers();
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        setCurrentUserRole(profile?.role || '');
      }
    } catch (error) {
      console.error("Erro ao carregar role do usuário atual:", error);
    }
  };

  const loadUsers = async () => {
    try {
      // admin_master vê todos exceto admin_master, admin_cliente vê apenas da empresa
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role, company_id")
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
      console.log("Saving permissions for user:", selectedUser.id);
      console.log("Custom permissions:", customPermissions);

      // Buscar o profile_id do usuário logado
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      console.log("Current user profile:", currentUserProfile);

      for (const perm of customPermissions) {
        console.log("Processing permission:", perm);
        
        const { error } = await supabase
          .from("user_permissions")
          .upsert({
            user_id: selectedUser.id,
            module_id: perm.module_id,
            can_access: perm.can_access,
            granted_by: currentUserProfile?.id,
          });

        if (error) {
          console.error("Error upserting permission:", error);
          throw error;
        }
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
        description: `Erro ao salvar permissões: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin_cliente":
        return "bg-orange-100 text-orange-800";
      case "gestor":
        return "bg-indigo-100 text-indigo-800";
      case "tecnico":
        return "bg-blue-100 text-blue-800";
      case "cliente_final":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin_cliente":
        return "Admin Cliente";
      case "gestor":
        return "Gestor Cliente";
      case "tecnico":
        return "Técnico Cliente";
      case "cliente_final":
        return "Cliente Final";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Permissões</h2>
        <p className="text-muted-foreground">
          {currentUserRole === 'admin_master' 
            ? "Configure quais módulos cada usuário pode acessar" 
            : "Configure quais módulos os usuários da sua empresa podem acessar"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              {currentUserRole === 'admin_master' 
                ? "Selecione um usuário para editar permissões" 
                : "Selecione um usuário da sua empresa para editar permissões"
              }
            </CardDescription>
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
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
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
