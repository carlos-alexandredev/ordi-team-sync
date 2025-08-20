import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Module {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'internal' | 'public';
  is_core: boolean;
}

interface ModuleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: Module | null;
  onSuccess: () => void;
}

export const ModuleFormModal = ({ open, onOpenChange, module, onSuccess }: ModuleFormModalProps) => {
  const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState<Module>({
    name: "",
    slug: "",
    description: "",
    category: undefined,
    status: 'inactive',
    visibility: 'internal',
    is_core: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (module) {
      setFormData(module);
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        category: undefined,
        status: 'inactive',
        visibility: 'internal',
        is_core: false
      });
    }
  }, [module, open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = module ? 'PATCH' : 'POST';
      const { data, error } = await supabase.functions.invoke('modules', {
        method,
        body: formData
      });

      if (error) throw error;

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: `Módulo ${module ? 'atualizado' : 'criado'} com sucesso`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "Erro",
        description: `Falha ao ${module ? 'atualizar' : 'criar'} módulo`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {module ? 'Editar Módulo' : 'Novo Módulo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nome do módulo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="slug-do-modulo"
              required
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do módulo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category || undefined}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Atendimento">Atendimento</SelectItem>
                <SelectItem value="Cadastros">Cadastros</SelectItem>
                <SelectItem value="Planejamento">Planejamento</SelectItem>
                <SelectItem value="Análise">Análise</SelectItem>
                <SelectItem value="Operação">Operação</SelectItem>
                <SelectItem value="Configuração">Configuração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidade</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: 'internal' | 'public') => 
                  setFormData(prev => ({ ...prev, visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_core"
              checked={formData.is_core}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_core: checked }))}
            />
            <Label htmlFor="is_core">Módulo do core do sistema</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : module ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};