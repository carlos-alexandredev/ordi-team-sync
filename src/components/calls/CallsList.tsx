import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, ArrowRight } from "lucide-react";
import { CallFormModal } from "./CallFormModal";

interface Call {
  id: string;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta";
  status: "aberto" | "em análise" | "fechado";
  created_at: string;
  client_profile: { name: string };
  company: { name: string };
}

export function CallsList() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { toast } = useToast();

  const loadCalls = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setUserRole(profile?.role || "");

      const { data, error } = await supabase
        .from("calls")
        .select(`
          *,
          client_profile: profiles!calls_client_id_fkey(name),
          company: companies(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar chamados:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar chamados",
          variant: "destructive",
        });
        return;
      }

      setCalls(data || []);
      setFilteredCalls(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  useEffect(() => {
    let filtered = calls;

    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(call => call.priority === priorityFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, priorityFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "destructive";
      case "média": return "default";
      case "baixa": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "destructive";
      case "em análise": return "default";
      case "fechado": return "secondary";
      default: return "default";
    }
  };

  const handleCreateOrder = async (callId: string) => {
    // Placeholder para criar ordem de serviço
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Criação de ordem de serviço será implementada em breve",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando chamados...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerenciamento de Chamados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar chamados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em análise">Em análise</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="média">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {userRole === "cliente_final" && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Chamado
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  {(userRole === "admin" || userRole === "admin_cliente") && (
                    <TableHead>Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === "cliente_final" ? 6 : 7} className="text-center">
                      Nenhum chamado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.title}</TableCell>
                      <TableCell>{call.client_profile?.name}</TableCell>
                      <TableCell>{call.company?.name}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(call.priority)}>
                          {call.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(call.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      {(userRole === "admin" || userRole === "admin_cliente") && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateOrder(call.id)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Gerar Ordem
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CallFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          loadCalls();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}