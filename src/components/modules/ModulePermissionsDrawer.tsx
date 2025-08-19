import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";

interface ModulePermission {
  id: string;
  role: string;
  action: string;
  allowed: boolean;
}

interface Module {
  id: string;
  name: string;
}

interface ModulePermissionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

const ROLES = ['admin', 'cliente', 'tecnico'];
const ACTIONS = ['view', 'create', 'update', 'delete', 'configure', 'activate'];

const ROLE_LABELS = {
  admin: 'Administrador',
  cliente: 'Cliente',
  tecnico: 'Técnico'
};

const ACTION_LABELS = {
  view: 'Visualizar',
  create: 'Criar',
  update: 'Editar', 
  delete: 'Excluir',
  configure: 'Configurar',
  activate: 'Ativar/Desativar'
};

export const ModulePermissionsDrawer = ({ open, onOpenChange, module }: ModulePermissionsDrawerProps) => {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && module) {
      loadPermissions();
    }
  }, [open, module]);

  const loadPermissions = async () => {
    if (!module) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('module_id', module.id)
        .order('role')
        .order('action');

      if (error) throw error;
      
      // Create a full matrix of permissions
      const permissionMap = new Map<string, boolean>();
      data?.forEach(perm => {
        permissionMap.set(`${perm.role}-${perm.action}`, perm.allowed);
      });

      const fullPermissions: ModulePermission[] = [];
      ROLES.forEach(role => {
        ACTIONS.forEach(action => {
          const existingPerm = data?.find(p => p.role === role && p.action === action);
          fullPermissions.push({
            id: existingPerm?.id || `${role}-${action}`,
            role,
            action,
            allowed: permissionMap.get(`${role}-${action}`) || false
          });
        });
      });

      setPermissions(fullPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role: string, action: string, allowed: boolean) => {
    setPermissions(prev => prev.map(perm => 
      perm.role === role && perm.action === action 
        ? { ...perm, allowed }
        : perm
    ));
  };

  const handleSavePermissions = async () => {
    if (!module) return;

    try {
      setSaving(true);
      
      // Prepare upsert data
      const upsertData = permissions.map(perm => ({
        module_id: module.id,
        role: perm.role,
        action: perm.action,
        allowed: perm.allowed
      }));

      const { error } = await supabase
        .from('module_permissions')
        .upsert(upsertData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissões salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar permissões",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      cliente: 'bg-blue-100 text-blue-800',
      tecnico: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Permissões do Módulo: {module?.name}</span>
            <Button onClick={handleSavePermissions} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Configure as permissões para cada papel e ação do sistema
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Papel</TableHead>
                    {ACTIONS.map(action => (
                      <TableHead key={action} className="text-center">
                        {ACTION_LABELS[action as keyof typeof ACTION_LABELS]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map(role => (
                    <TableRow key={role}>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(role)}>
                          {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                        </Badge>
                      </TableCell>
                      {ACTIONS.map(action => {
                        const permission = permissions.find(p => p.role === role && p.action === action);
                        return (
                          <TableCell key={action} className="text-center">
                            <Switch
                              checked={permission?.allowed || false}
                              onCheckedChange={(allowed) => handlePermissionChange(role, action, allowed)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Legendas:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Visualizar:</strong> Ver módulo e dados</div>
                  <div><strong>Criar:</strong> Adicionar novos registros</div>
                  <div><strong>Editar:</strong> Modificar registros existentes</div>
                  <div><strong>Excluir:</strong> Remover registros</div>
                  <div><strong>Configurar:</strong> Alterar configurações</div>
                  <div><strong>Ativar/Desativar:</strong> Controlar status do módulo</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};