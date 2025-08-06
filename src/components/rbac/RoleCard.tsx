import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  permission_name: string;
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

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
  onRefresh: () => void;
}

export function RoleCard({ role, onEdit, onDelete, onRefresh }: RoleCardProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRoleData();
  }, [role.id]);

  const loadRoleData = async () => {
    try {
      console.log('Carregando dados para role:', role.name);
      
      // Buscar permissões da role
      const { data: permissionsData, error: permissionsError } = await supabase
        .rpc('get_role_permissions', { role_name: role.name });

      if (permissionsError) {
        console.error('Erro ao carregar permissões:', permissionsError);
        throw permissionsError;
      }

      // Buscar contagem de usuários
      const { data: countData, error: countError } = await supabase
        .rpc('count_users_by_role', { role_name: role.name });

      if (countError) {
        console.error('Erro ao carregar contagem de usuários:', countError);
        throw countError;
      }

      console.log('Dados carregados:', { permissionsData, countData });
      setPermissions(permissionsData || []);
      setUserCount(countData || 0);
    } catch (error) {
      console.error('Erro ao carregar dados da role:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a role "${role.display_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Role excluída com sucesso",
      });

      onDelete(role.id);
    } catch (error) {
      console.error('Erro ao excluir role:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded w-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {role.display_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {role.description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{userCount} usuários</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Permissões:</h4>
            <div className="space-y-1">
              {permissions.map((permission) => (
                <div key={permission.permission_name} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full bg-green-500" 
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-sm">{permission.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(role)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          {!role.is_system_role && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}