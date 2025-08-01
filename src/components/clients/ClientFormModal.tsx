import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company_id?: string;
  active: boolean;
}

interface Company {
  id: string;
  name: string;
}

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  companies: Company[];
}

export function ClientFormModal({ open, onClose, client, companies }: ClientFormModalProps) {
  console.log("ClientFormModal render - open:", open, "client:", client, "companies:", companies);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_id: "",
    password: "",
    active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    console.log("ClientFormModal - modal opened:", open, "client data:", client);
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company_id: client.company_id || "",
        password: "",
        active: client.active,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_id: "",
        password: "",
        active: true,
      });
    }
  }, [client, open]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "E-mail é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "E-mail deve ter um formato válido.",
        variant: "destructive",
      });
      return;
    }

    if (!client && (!formData.password || formData.password.length < 6)) {
      toast({
        title: "Erro de validação",
        description: "Senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (client) {
        // Atualizar cliente existente - apenas o perfil
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          company_id: formData.company_id === "" ? null : formData.company_id,
          active: formData.active,
        };

        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", client.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado",
          description: "Os dados foram salvos com sucesso.",
        });
      } else {
        // Criar novo cliente - primeiro criar usuário na auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              name: formData.name.trim(),
            },
          },
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Erro ao criar usuário de autenticação");
        }

        // O trigger handle_new_user criará automaticamente o registro na tabela profiles
        // Precisamos aguardar um pouco e depois atualizar com os dados específicos do cliente
        setTimeout(async () => {
          try {
            const updateData = {
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim() || null,
              company_id: formData.company_id === "" ? null : formData.company_id,
              active: formData.active,
              role: 'cliente_final',
            };

            const { error: profileError } = await supabase
              .from("profiles")
              .update(updateData)
              .eq("user_id", authData.user.id);

            if (profileError) {
              console.error("Erro ao atualizar perfil:", profileError);
            }
          } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
          }
        }, 1000);

        toast({
          title: "Cliente cadastrado",
          description: "O novo cliente foi criado com sucesso.",
        });
      }

      onClose();
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.message.includes("duplicate key") || error.message.includes("already registered")) {
        errorMessage = "Já existe um usuário com este e-mail.";
      }

      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    console.log("Modal is not open, returning null");
    return null;
  }

  console.log("About to render modal - open:", open, "client:", client, "companies length:", companies?.length);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@email.com"
                required
                disabled={!!client} // E-mail não pode ser alterado após criação
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa</Label>
              <Select 
                value={formData.company_id || ""} 
                onValueChange={(value) => setFormData({ ...formData, company_id: value || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma empresa</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!client && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Cliente ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : client ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}