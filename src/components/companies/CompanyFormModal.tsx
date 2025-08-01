import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  fantasy_name?: string;
  cnpj?: string;
  responsible_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

interface CompanyFormModalProps {
  open: boolean;
  onClose: () => void;
  company?: Company | null;
}

export function CompanyFormModal({ open, onClose, company }: CompanyFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fantasy_name: "",
    cnpj: "",
    responsible_name: "",
    phone: "",
    email: "",
    address: "",
    active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        fantasy_name: company.fantasy_name || "",
        cnpj: company.cnpj || "",
        responsible_name: company.responsible_name || "",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || "",
        active: company.active,
      });
    } else {
      setFormData({
        name: "",
        fantasy_name: "",
        cnpj: "",
        responsible_name: "",
        phone: "",
        email: "",
        address: "",
        active: true,
      });
    }
  }, [company, open]);

  const validateCNPJ = (cnpj: string) => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se não são todos iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    return true;
  };

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
        description: "Nome empresarial é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.responsible_name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do responsável é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      toast({
        title: "Erro de validação",
        description: "CNPJ deve ter 14 dígitos e ser válido.",
        variant: "destructive",
      });
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "E-mail deve ter um formato válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se CNPJ já existe
      if (formData.cnpj) {
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("cnpj", formData.cnpj)
          .neq("id", company?.id || "")
          .single();

        if (existingCompany) {
          toast({
            title: "Erro de validação",
            description: "Já existe uma empresa com este CNPJ.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const dataToSave = {
        name: formData.name.trim(),
        fantasy_name: formData.fantasy_name.trim() || null,
        cnpj: formData.cnpj.replace(/\D/g, "") || null,
        responsible_name: formData.responsible_name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        active: formData.active,
      };

      if (company) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from("companies")
          .update(dataToSave)
          .eq("id", company.id);

        if (error) throw error;

        toast({
          title: "Empresa atualizada",
          description: "Os dados foram salvos com sucesso.",
        });
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from("companies")
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Empresa cadastrada",
          description: "A nova empresa foi criada com sucesso.",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 14) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {company ? "Editar Empresa" : "Nova Empresa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Empresarial *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Razão social"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fantasy_name">Nome Fantasia</Label>
              <Input
                id="fantasy_name"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                placeholder="Nome fantasia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_name">Responsável *</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                placeholder="Nome do responsável"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço completo"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Empresa ativa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : company ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}