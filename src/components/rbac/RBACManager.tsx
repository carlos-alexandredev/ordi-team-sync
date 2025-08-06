import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Shield, Settings } from "lucide-react";
import { RoleCard } from "./RoleCard";
import { RoleFormModal } from "./RoleFormModal";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id?: string;
  active: boolean;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  is_system_role: boolean;
}

export function RBACManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(`
          id, 
          name, 
          email, 
          role, 
          role_id,
          active,
          roles:role_id (
            name,
            display_name
          )
        `);

      if (usersError) throw usersError;

      // Carregar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .order("display_name");

      if (rolesError) throw rolesError;

      // Carregar permissões
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("permissions")
        .select("*")
        .order("display_name");

      if (permissionsError) throw permissionsError;

      setUsers(usersData || []);
      setRoles(rolesData || []);
      setPermissions(permissionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRoleId: string) => {
    try {
      // Buscar a role pelo ID para obter o nome
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("id", newRoleId)
        .single();

      if (roleError) throw roleError;

      const { error } = await supabase
        .from("profiles")
        .update({ 
          role: roleData.name,
          role_id: newRoleId 
        })
        .eq("id", userId);

      if (error) throw error;

      // Recarregar dados
      loadData();

      toast({
        title: "Sucesso",
        description: "Role do usuário atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar role do usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar role do usuário",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active })
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, active } : user
      ));

      toast({
        title: "Sucesso",
        description: `Usuário ${active ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      toast({
        title: "Erro", 
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
  };

  const handleRoleModalSuccess = () => {
    loadData();
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const getRoleBadge = (role: string, roles: any) => {
    const roleObj = roles?.find((r: any) => r.name === role);
    const roleConfig = {
      admin_master: { label: "Admin Master", className: "bg-purple-100 text-purple-800 border-purple-300" },
      admin: { label: "Admin", className: "bg-red-100 text-red-800 border-red-300" },
      admin_cliente: { label: "Admin Cliente", className: "bg-orange-100 text-orange-800 border-orange-300" },
      gestor: { label: "Gestor", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
      tecnico: { label: "Técnico", className: "bg-blue-100 text-blue-800 border-blue-300" },
      cliente_final: { label: "Cliente Final", className: "bg-green-100 text-green-800 border-green-300" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: roleObj?.display_name || role, 
      className: "bg-gray-100 text-gray-800 border-gray-300" 
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Carregando dados RBAC...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Acesso Baseado em Roles</h1>
        <Button onClick={handleCreateRole}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Role
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Settings className="w-4 h-4 mr-2" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie roles e permissões dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(user.role, (user as any).roles)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.active}
                          onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role_id || ""}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Selecionar role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={handleEditRole}
                onDelete={handleDeleteRole}
                onRefresh={loadData}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Permissões</CardTitle>
              <CardDescription>
                Visualize e gerencie permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Roles com Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.display_name}</TableCell>
                      <TableCell className="capitalize">{permission.resource}</TableCell>
                      <TableCell className="capitalize">{permission.action}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {roles
                            .filter(role => {
                              // Verificar se a role tem essa permissão consultando role_permissions
                              // Por simplificação, mostramos todas as roles do admin_master
                              return role.name === 'admin_master';
                            })
                            .map(role => (
                              <Badge
                                key={role.id}
                                style={{ backgroundColor: role.color }}
                                className="text-white text-xs"
                              >
                                {role.display_name}
                              </Badge>
                            ))
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={handleRoleModalSuccess}
        editingRole={editingRole}
      />
    </div>
  );
}