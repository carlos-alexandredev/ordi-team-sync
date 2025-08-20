import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Network } from "lucide-react";

interface ModuleDependency {
  id: string;
  depends_on_module: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

interface Module {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface ModuleDependenciesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

export const ModuleDependenciesDrawer = ({ open, onOpenChange, module }: ModuleDependenciesDrawerProps) => {
  const [dependencies, setDependencies] = useState<ModuleDependency[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (open && module) {
      loadDependencies();
      loadAvailableModules();
    }
  }, [open, module]);

  const loadDependencies = async () => {
    if (!module) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('module_dependencies')
        .select(`
          id,
          depends_on_module:modules!module_dependencies_depends_on_module_id_fkey (
            id, name, slug, status
          )
        `)
        .eq('module_id', module.id);

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      console.error('Error loading dependencies:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dependências",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModules = async () => {
    if (!module) return;

    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, slug, status')
        .neq('id', module.id)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setAvailableModules(data || []);
    } catch (error) {
      console.error('Error loading available modules:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!module || !selectedModuleId) return;

    try {
      // Check for circular dependency
      const { data: existingDep } = await supabase
        .from('module_dependencies')
        .select('id')
        .eq('module_id', selectedModuleId)
        .eq('depends_on_module_id', module.id)
        .single();

      if (existingDep) {
        toast({
          title: "Erro",
          description: "Esta dependência criaria uma dependência circular",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('module_dependencies')
        .insert({
          module_id: module.id,
          depends_on_module_id: selectedModuleId
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dependência adicionada com sucesso",
      });
      loadDependencies();
      setShowAddModal(false);
      setSelectedModuleId(undefined);
    } catch (error) {
      console.error('Error adding dependency:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar dependência",
        variant: "destructive"
      });
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!confirm('Tem certeza que deseja remover esta dependência?')) return;

    try {
      const { error } = await supabase
        .from('module_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dependência removida com sucesso",
      });
      loadDependencies();
    } catch (error) {
      console.error('Error removing dependency:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover dependência",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      archived: "outline"
    } as const;
    
    const labels = {
      active: "Ativo",
      inactive: "Inativo", 
      archived: "Arquivado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Filter out modules that are already dependencies
  const filteredAvailableModules = availableModules.filter(
    mod => !dependencies.some(dep => dep.depends_on_module?.id === mod.id)
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Dependências do Módulo: {module?.name}</span>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Dependência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Dependência</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Módulo Dependente *
                    </label>
                    <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAvailableModules.map((mod) => (
                          <SelectItem key={mod.id} value={mod.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{mod.name}</span>
                              {getStatusBadge(mod.status)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O módulo "{module?.name}" dependerá do módulo selecionado
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddDependency}
                      disabled={!selectedModuleId}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dependencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma dependência configurada</p>
              <p className="text-sm">Este módulo não depende de outros módulos</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-4">
                Este módulo depende dos seguintes módulos:
              </div>
              
              {dependencies.map((dependency) => (
                <div
                  key={dependency.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">
                        {dependency.depends_on_module?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {dependency.depends_on_module?.slug}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {dependency.depends_on_module?.status && 
                      getStatusBadge(dependency.depends_on_module.status)
                    }
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDependency(dependency.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dependencies.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Importante:</h4>
              <p className="text-sm text-yellow-700">
                Este módulo só funcionará corretamente se todos os módulos dos quais depende estiverem ativos.
                Desativar ou excluir um módulo dependente pode causar problemas de funcionalidade.
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};