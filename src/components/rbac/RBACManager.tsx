import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Lock, Key, Settings, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  company_name?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  users_count: number;
}

const DEFAULT_PERMISSIONS = [
  { id: 'users:read', name: 'Visualizar Usuários', description: 'Ver lista e detalhes dos usuários', resource: 'users', action: 'read' },
  { id: 'users:write', name: 'Gerenciar Usuários', description: 'Criar, editar e desativar usuários', resource: 'users', action: 'write' },
  { id: 'orders:read', name: 'Visualizar Ordens', description: 'Ver lista e detalhes das ordens', resource: 'orders', action: 'read' },
  { id: 'orders:write', name: 'Gerenciar Ordens', description: 'Criar, editar e cancelar ordens', resource: 'orders', action: 'write' },
  { id: 'equipments:read', name: 'Visualizar Equipamentos', description: 'Ver lista e detalhes dos equipamentos', resource: 'equipments', action: 'read' },
  { id: 'equipments:write', name: 'Gerenciar Equipamentos', description: 'Criar, editar e remover equipamentos', resource: 'equipments', action: 'write' },
  { id: 'companies:read', name: 'Visualizar Empresas', description: 'Ver lista e detalhes das empresas', resource: 'companies', action: 'read' },
  { id: 'companies:write', name: 'Gerenciar Empresas', description: 'Criar, editar e remover empresas', resource: 'companies', action: 'write' },
  { id: 'reports:read', name: 'Visualizar Relatórios', description: 'Acessar relatórios e analytics', resource: 'reports', action: 'read' },
  { id: 'reports:export', name: 'Exportar Relatórios', description: 'Exportar dados e relatórios', resource: 'reports', action: 'export' },
  { id: 'settings:read', name: 'Visualizar Configurações', description: 'Ver configurações do sistema', resource: 'settings', action: 'read' },
  { id: 'settings:write', name: 'Gerenciar Configurações', description: 'Alterar configurações do sistema', resource: 'settings', action: 'write' }
];

export function RBACManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          role,
          active,
          company:companies(name)
        `)
        .order("name");

      const formattedUsers: User[] = data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        company_name: user.company?.name
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const loadRoles = async () => {
    try {
      // Simulando dados de roles já que não temos tabela específica
      const mockRoles: Role[] = [
        {
          id: 'admin',
          name: 'Administrador',
          description: 'Acesso completo ao sistema',
          permissions: permissions.map(p => p.id),
          users_count: users.filter(u => u.role === 'admin').length
        },
        {
          id: 'admin_cliente',
          name: 'Admin Cliente',
          description: 'Administrador de empresa cliente',
          permissions: [
            'users:read', 'orders:read', 'orders:write', 
            'equipments:read', 'equipments:write', 'reports:read', 'reports:export'
          ],
          users_count: users.filter(u => u.role === 'admin_cliente').length
        },
        {
          id: 'tecnico',
          name: 'Técnico',
          description: 'Execução de ordens de serviço',
          permissions: ['orders:read', 'equipments:read', 'reports:read'],
          users_count: users.filter(u => u.role === 'tecnico').length
        },
        {
          id: 'cliente_final',
          name: 'Cliente Final',
          description: 'Acesso limitado para clientes',
          permissions: ['orders:read'],
          users_count: users.filter(u => u.role === 'cliente_final').length
        }
      ];

      setRoles(mockRoles);
    } catch (error) {
      console.error("Erro ao carregar roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Role atualizada",
        description: "A role do usuário foi atualizada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar role do usuário.",
        variant: "destructive"
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
        title: "Status atualizado",
        description: `Usuário ${active ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário.",
        variant: "destructive"
      });
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim() || newRolePermissions.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e pelo menos uma permissão são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newRole: Role = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      name: newRoleName,
      description: newRoleDescription,
      permissions: newRolePermissions,
      users_count: 0
    };

    setRoles(prev => [...prev, newRole]);
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRolePermissions([]);
    setDialogOpen(false);

    toast({
      title: "Role criada",
      description: "Nova role criada com sucesso."
    });
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'admin_cliente':
        return 'bg-blue-100 text-blue-800';
      case 'tecnico':
        return 'bg-green-100 text-green-800';
      case 'cliente_final':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const togglePermission = (permissionId: string) => {
    setNewRolePermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando controles de acesso...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Controle de Acesso (RBAC)</h2>
          <p className="text-muted-foreground">
            Gerenciamento detalhado de roles e permissões
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Role</DialogTitle>
              <DialogDescription>
                Configure uma nova role com permissões específicas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Role</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ex: Supervisor"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Descrição da role..."
                />
              </div>
              <div>
                <Label className="text-base font-medium">Permissões</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {permissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        checked={newRolePermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{permission.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createRole}>
                  Criar Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* Aba Usuários */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie roles e status dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role Atual</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {roles.find(r => r.id === user.role)?.name || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.company_name || "N/A"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.active}
                          onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
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

        {/* Aba Roles */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {role.name}
                      </CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {role.users_count} usuários
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Permissões:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {role.permissions.map(permissionId => {
                          const permission = permissions.find(p => p.id === permissionId);
                          return permission ? (
                            <div key={permissionId} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              {permission.name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                    {role.id !== 'admin' && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Permissões */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>
                Visualize todas as permissões disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Roles com Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map(permission => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.resource}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{permission.action}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roles
                            .filter(role => role.permissions.includes(permission.id))
                            .map(role => (
                              <Badge key={role.id} className={getRoleColor(role.id)}>
                                {role.name}
                              </Badge>
                            ))}
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
    </div>
  );
}