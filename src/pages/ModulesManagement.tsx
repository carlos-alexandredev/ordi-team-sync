import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  History,
  Settings,
  Shield,
  Network
} from "lucide-react";
import { ModuleFormModal } from "@/components/modules/ModuleFormModal";
import { ModuleVersionsDrawer } from "@/components/modules/ModuleVersionsDrawer";
import { ModuleSettingsDrawer } from "@/components/modules/ModuleSettingsDrawer";
import { ModulePermissionsDrawer } from "@/components/modules/ModulePermissionsDrawer";
import { ModuleDependenciesDrawer } from "@/components/modules/ModuleDependenciesDrawer";

interface Module {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'internal' | 'public';
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

const ModulesManagement = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVersionsDrawer, setShowVersionsDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showPermissionsDrawer, setShowPermissionsDrawer] = useState(false);
  const [showDependenciesDrawer, setShowDependenciesDrawer] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('modules', {
        method: 'GET'
      });

      if (error) throw error;

      if (data.ok) {
        setModules(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar módulos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (module: Module) => {
    try {
      const newStatus = module.status === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? 'activate' : 'deactivate';
      
      const { data, error } = await supabase.functions.invoke('modules', {
        method: 'POST',
        body: {},
        // Note: URL path should be handled by the edge function routing
      });

      if (error) throw error;

      if (data.ok) {
        loadModules();
        toast({
          title: "Sucesso",
          description: `Módulo ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do módulo",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (module: Module, hardDelete = false) => {
    if (!confirm(`Tem certeza que deseja ${hardDelete ? 'excluir permanentemente' : 'excluir'} o módulo "${module.name}"?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('modules', {
        method: 'DELETE',
        // Note: Module ID and hard delete flag should be handled by the edge function
      });

      if (error) throw error;

      if (data.ok) {
        loadModules();
        toast({
          title: "Sucesso",
          description: `Módulo ${hardDelete ? 'excluído permanentemente' : 'excluído'} com sucesso`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir módulo",
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
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const colors = {
      'Atendimento': 'bg-blue-100 text-blue-800',
      'Cadastros': 'bg-green-100 text-green-800', 
      'Planejamento': 'bg-purple-100 text-purple-800',
      'Análise': 'bg-orange-100 text-orange-800'
    } as const;

    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = !searchTerm || 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || module.status === statusFilter;
    const matchesCategory = !categoryFilter || module.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Módulos</h1>
              <p className="text-muted-foreground">
                Gerencie módulos do sistema, versões, dependências e permissões
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Módulo
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar módulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atendimento">Atendimento</SelectItem>
                    <SelectItem value="Cadastros">Cadastros</SelectItem>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Análise">Análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Módulos ({filteredModules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Core</TableHead>
                      <TableHead>Atualizado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">
                          {module.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {module.slug}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(module.status)}
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(module.category)}
                        </TableCell>
                        <TableCell>
                          {module.is_core && (
                            <Badge variant="outline">Core</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(module.updated_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(module)}
                            >
                              {module.status === 'active' ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setShowVersionsDrawer(true);
                              }}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setShowSettingsDrawer(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setShowPermissionsDrawer(true);
                              }}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setShowDependenciesDrawer(true);
                              }}
                            >
                              <Network className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(module)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modals and Drawers */}
          <ModuleFormModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSuccess={loadModules}
          />
          
          <ModuleFormModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            module={selectedModule}
            onSuccess={loadModules}
          />

          <ModuleVersionsDrawer
            open={showVersionsDrawer}
            onOpenChange={setShowVersionsDrawer}
            module={selectedModule}
          />

          <ModuleSettingsDrawer
            open={showSettingsDrawer}
            onOpenChange={setShowSettingsDrawer}
            module={selectedModule}
          />

          <ModulePermissionsDrawer
            open={showPermissionsDrawer}
            onOpenChange={setShowPermissionsDrawer}
            module={selectedModule}
          />

          <ModuleDependenciesDrawer
            open={showDependenciesDrawer}
            onOpenChange={setShowDependenciesDrawer}
            module={selectedModule}
          />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default ModulesManagement;