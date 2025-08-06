import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRole?: Role | null;
}

export function RoleFormModal({ isOpen, onClose, onSuccess, editingRole }: RoleFormModalProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      if (editingRole) {
        setName(editingRole.name);
        setDisplayName(editingRole.display_name);
        setDescription(editingRole.description || "");
        setColor(editingRole.color);
        loadRolePermissions(editingRole.id);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingRole]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (error) throw error;
      setSelectedPermissions(data?.map(rp => rp.permission_id) || []);
    } catch (error) {
      console.error('Erro ao carregar permissões da role:', error);
    }
  };

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setDescription("");
    setColor("#3B82F6");
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRole) {
        // Atualizar role existente
        const { error: roleError } = await supabase
          .from('roles')
          .update({
            name,
            display_name: displayName,
            description,
            color,
          })
          .eq('id', editingRole.id);

        if (roleError) throw roleError;

        // Atualizar permissões
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', editingRole.id);

        if (selectedPermissions.length > 0) {
          const rolePermissionsData = selectedPermissions.map(permissionId => ({
            role_id: editingRole.id,
            permission_id: permissionId,
          }));

          const { error: permissionsError } = await supabase
            .from('role_permissions')
            .insert(rolePermissionsData);

          if (permissionsError) throw permissionsError;
        }
      } else {
        // Criar nova role
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .insert({
            name,
            display_name: displayName,
            description,
            color,
            is_system_role: false,
          })
          .select()
          .single();

        if (roleError) throw roleError;

        // Inserir permissões
        if (selectedPermissions.length > 0) {
          const rolePermissionsData = selectedPermissions.map(permissionId => ({
            role_id: roleData.id,
            permission_id: permissionId,
          }));

          const { error: permissionsError } = await supabase
            .from('role_permissions')
            .insert(rolePermissionsData);

          if (permissionsError) throw permissionsError;
        }
      }

      toast({
        title: "Sucesso",
        description: editingRole ? "Role atualizada com sucesso" : "Role criada com sucesso",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar role:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRole ? "Editar Role" : "Nova Role"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Interno</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="admin_custom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Admin Personalizado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da role..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-24 h-10"
            />
          </div>

          <div className="space-y-4">
            <Label>Permissões</Label>
            <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                <div key={resource} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize">{resource}</h4>
                  <div className="space-y-2 ml-4">
                    {resourcePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <Label htmlFor={permission.id} className="text-sm cursor-pointer">
                          {permission.display_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingRole ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}