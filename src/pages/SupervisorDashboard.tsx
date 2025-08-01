import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  Calendar,
  User,
  Building,
  Download,
  Grid3x3,
  List,
  Pause,
  UserX,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Call {
  id: string;
  title: string;
  description: string;
  priority: 'baixa' | 'média' | 'alta' | 'crítica';
  status: 'aberto' | 'fechado' | 'em análise' | 'em_andamento' | 'aguardando_cliente' | 'resolvido';
  created_at: string;
  client_id: string;
  company_id: string;
  client?: {
    name: string;
  };
  company?: {
    name: string;
  };
}

const SupervisorDashboard = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { toast } = useToast();

  useEffect(() => {
    loadCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [calls, searchTerm, statusFilter, priorityFilter]);

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          client:profiles!calls_client_id_fkey(name),
          company:companies!calls_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar chamados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCalls = () => {
    let filtered = calls;

    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(call => call.priority === priorityFilter);
    }

    setFilteredCalls(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'crítica': return 'destructive';
      case 'alta': return 'destructive';
      case 'média': return 'default';
      case 'baixa': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'destructive';
      case 'em análise': return 'secondary';
      case 'em_andamento': return 'default';
      case 'aguardando_cliente': return 'secondary';
      case 'resolvido': return 'default';
      case 'fechado': return 'outline';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDetailedStats = () => {
    return {
      nao_lidos: calls.filter(c => c.status === 'aberto').length,
      abertos: calls.filter(c => c.status === 'aberto' || c.status === 'em_andamento').length,
      em_espera: calls.filter(c => c.status === 'aguardando_cliente').length,
      em_atraso: calls.filter(c => {
        // Simulação de atraso - chamados abertos há mais de 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return c.status === 'aberto' && new Date(c.created_at) < oneDayAgo;
      }).length,
      pausados: 0, // Não temos esse status ainda
      nao_atribuidos: calls.filter(c => c.status === 'aberto').length,
      encerrando_hoje: calls.filter(c => {
        // Simulação - chamados que devem ser encerrados hoje
        const today = new Date().toDateString();
        return c.status === 'em_andamento' && new Date(c.created_at).toDateString() === today;
      }).length,
    };
  };

  const stats = getDetailedStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel do Supervisor</h1>
          <p className="text-muted-foreground">
            Visão completa dos chamados e ordens de serviço
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards - Estilo Auvo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Não lidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.nao_lidos}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.abertos}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.em_espera}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.em_atraso}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pausados}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Não atribuídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.nao_atribuidos}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Encerram hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.encerrando_hoje}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Tickets
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, título, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em análise">Em Análise</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="média">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calls Table */}
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Nenhum ticket corresponde aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Código</th>
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Empresa</th>
                    <th className="text-left p-3 font-medium">Criado em</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Prioridade</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call, index) => (
                    <tr key={call.id} className={index % 2 === 0 ? 'bg-muted/25' : 'bg-background'}>
                      <td className="p-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          #{call.id.slice(0, 8)}
                        </code>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{call.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {call.description}
                        </div>
                      </td>
                      <td className="p-3">{call.client?.name || 'N/A'}</td>
                      <td className="p-3">{call.company?.name || 'N/A'}</td>
                      <td className="p-3 text-sm">{formatDate(call.created_at)}</td>
                      <td className="p-3">
                        <Badge variant={getStatusColor(call.status) as any}>
                          {call.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={getPriorityColor(call.priority) as any}>
                          {call.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;