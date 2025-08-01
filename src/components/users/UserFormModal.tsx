import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id?: string;
}

interface Company {
  id: string;
  name: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: User | null;
  companies: Company[];
}

export function UserFormModal({ isOpen, onClose, onSuccess, editingUser, companies }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cliente_final",
    company_id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        company_id: editingUser.company_id || "",
        password: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "cliente_final",
        company_id: "",
        password: "",
      });
    }
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            company_id: formData.company_id || null,
          })
          .eq("id", editingUser.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário
        if (formData.password.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter pelo menos 6 caracteres",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Primeiro criar o usuário no auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Atualizar o profile criado automaticamente pelo trigger
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              name: formData.name,
              role: formData.role,
              company_id: formData.company_id || null,
            })
            .eq("user_id", authData.user.id);

          if (profileError) throw profileError;
        }

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingUser} // Não permite alterar email de usuário existente
            />
          </div>

          {!editingUser && (
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="role">Perfil *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="cliente_final">Cliente Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Select value={formData.company_id || "none"} onValueChange={(value) => setFormData({ ...formData, company_id: value === "none" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma empresa</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}