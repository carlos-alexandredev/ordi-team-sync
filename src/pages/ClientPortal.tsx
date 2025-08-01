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
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CallFormModal } from "@/components/calls/CallFormModal";

interface Call {
  id: string;
  title: string;
  description: string;
  priority: 'baixa' | 'média' | 'alta' | 'crítica';
  status: 'aberto' | 'fechado' | 'em análise' | 'em_andamento' | 'aguardando_cliente' | 'resolvido';
  created_at: string;
  client_id: string;
  company_id: string;
}

const ClientPortal = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
    loadCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [calls, searchTerm, statusFilter, priorityFilter]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return AlertCircle;
      case 'em análise': return Clock;
      case 'em_andamento': return Clock;
      case 'resolvido': return CheckCircle;
      case 'fechado': return CheckCircle;
      default: return FileText;
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

  const getStats = () => {
    return {
      total: calls.length,
      abertos: calls.filter(c => c.status === 'aberto').length,
      em_andamento: calls.filter(c => c.status === 'em_andamento' || c.status === 'em análise').length,
      resolvidos: calls.filter(c => c.status === 'resolvido').length,
    };
  };

  const stats = getStats();

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
          <h1 className="text-3xl font-bold">Portal do Cliente</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userProfile?.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.abertos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.em_andamento}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
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
        </CardContent>
      </Card>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {calls.length === 0 
                  ? "Você ainda não fez nenhuma solicitação." 
                  : "Nenhuma solicitação corresponde aos filtros aplicados."
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira solicitação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => {
                const StatusIcon = getStatusIcon(call.status);
                return (
                  <div key={call.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <h3 className="font-medium">{call.title}</h3>
                          <Badge variant={getPriorityColor(call.priority) as any}>
                            {call.priority}
                          </Badge>
                          <Badge variant={getStatusColor(call.status) as any}>
                            {call.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(call.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Call Modal */}
      <CallFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadCalls}
      />
    </div>
  );
};

export default ClientPortal;