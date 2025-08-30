import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Edit, Trash2, Settings } from "lucide-react";
import { FAQFormModal } from "@/components/faq/FAQFormModal";
import { FAQImportExport } from "@/components/faq/FAQImportExport";
import { AISettings } from "@/components/faq/AISettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  tags: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function FAQ() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  // Get user role
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_role');
        if (error) throw error;
        setUserRole(data || '');
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    getUserRole();
  }, []);

  const { data: faqs = [], refetch } = useQuery({
    queryKey: ["faqs", searchTerm, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase.from("faqs").select("*").order("updated_at", { ascending: false });
      
      if (searchTerm) {
        query = query.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["faq-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq_categories").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta FAQ?")) return;

    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      
      await logActivity({
        action: "delete_faq",
        table_name: "faqs",
        record_id: id
      });
      
      toast({
        title: "FAQ excluída com sucesso",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir FAQ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "default" as const,
      draft: "secondary" as const,
      archived: "outline" as const,
    };
    
    const labels = {
      published: "Publicada",
      draft: "Rascunho",
      archived: "Arquivada",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingFaq(null);
    refetch();
  };

  const canManageFAQs = userRole && ['admin', 'admin_cliente', 'admin_master', 'gestor'].includes(userRole);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente", "admin_master", "cliente_final", "tecnico", "gestor", "supervisor"]}>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Perguntas Frequentes</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie as perguntas e respostas frequentes do sistema
              </p>
            </div>
            {canManageFAQs && (
              <div className="flex gap-2">
                <FAQImportExport onImportComplete={refetch} />
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova FAQ
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="management" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management">Gerenciar FAQs</TabsTrigger>
              {canManageFAQs && (
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription>
                    Use os filtros abaixo para encontrar FAQs específicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar perguntas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="published">Publicada</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="archived">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setCategoryFilter("all");
                      }}
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pergunta</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Atualizado em</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id}>
                          <TableCell className="max-w-md">
                            <div className="font-medium truncate">{faq.question}</div>
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {faq.answer.substring(0, 100)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            {faq.category && (
                              <Badge variant="outline">{faq.category}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(faq.status)}</TableCell>
                          <TableCell>
                            {new Date(faq.updated_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {canManageFAQs && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(faq)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(faq.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {faqs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma FAQ encontrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {canManageFAQs && (
              <TabsContent value="settings">
                <AISettings />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <FAQFormModal
          isOpen={isFormOpen}
          onClose={handleFormClose}
          faq={editingFaq}
        />
      </ProtectedRoute>
    </AuthLayout>
  );
}