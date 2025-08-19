import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Star, Calendar } from "lucide-react";

interface ModuleVersion {
  id: string;
  semver: string;
  changelog?: string;
  is_stable: boolean;
  created_at: string;
}

interface Module {
  id: string;
  name: string;
}

interface ModuleVersionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

export const ModuleVersionsDrawer = ({ open, onOpenChange, module }: ModuleVersionsDrawerProps) => {
  const [versions, setVersions] = useState<ModuleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVersion, setNewVersion] = useState({ semver: "", changelog: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (open && module) {
      loadVersions();
    }
  }, [open, module]);

  const loadVersions = async () => {
    if (!module) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('module_versions')
        .select('*')
        .eq('module_id', module.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar versões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    try {
      const { data, error } = await supabase.functions.invoke('modules', {
        method: 'POST',
        body: {
          semver: newVersion.semver,
          changelog: newVersion.changelog
        }
        // Note: Module ID should be handled by the edge function routing
      });

      if (error) throw error;

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: "Versão criada com sucesso",
        });
        loadVersions();
        setShowAddModal(false);
        setNewVersion({ semver: "", changelog: "" });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar versão",
        variant: "destructive"
      });
    }
  };

  const handleMarkStable = async (versionId: string) => {
    try {
      // First, unmark all other versions as stable
      const { error: unmarkerError } = await supabase
        .from('module_versions')
        .update({ is_stable: false })
        .eq('module_id', module?.id);

      if (unmarkerError) throw unmarkerError;

      // Then mark this version as stable
      const { error } = await supabase
        .from('module_versions')
        .update({ is_stable: true })
        .eq('id', versionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Versão marcada como estável",
      });
      loadVersions();
    } catch (error) {
      console.error('Error marking version as stable:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar versão como estável",
        variant: "destructive"
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Versões do Módulo: {module?.name}</span>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Versão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Versão</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddVersion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="semver">Versão (semver) *</Label>
                    <Input
                      id="semver"
                      value={newVersion.semver}
                      onChange={(e) => setNewVersion(prev => ({ ...prev, semver: e.target.value }))}
                      placeholder="1.0.0"
                      pattern="^\d+\.\d+\.\d+$"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Use versionamento semântico (ex: 1.0.0, 2.1.3)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="changelog">Changelog</Label>
                    <Textarea
                      id="changelog"
                      value={newVersion.changelog}
                      onChange={(e) => setNewVersion(prev => ({ ...prev, changelog: e.target.value }))}
                      placeholder="Descreva as mudanças desta versão..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Criar Versão
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma versão encontrada
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-lg">
                      v{version.semver}
                    </span>
                    {version.is_stable && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="w-3 h-3 mr-1" />
                        Estável
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(version.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {!version.is_stable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkStable(version.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Marcar como Estável
                      </Button>
                    )}
                  </div>
                </div>
                
                {version.changelog && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Changelog:</h4>
                    <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                      {version.changelog}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};