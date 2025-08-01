import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Users, Building, UserCheck, ClipboardList, Wrench, BarChart, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ServiceOrder {
  id: string;
  order_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  due_date?: string;
}

interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  completed: number;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, open: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOrders(), fetchUserProfile()]);
    };
    loadData();
  }, []);

  const fetchUserProfile = async () => {
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setOrders(data || []);
      
      // Calcular estatísticas
      const allOrders = data || [];
      setStats({
        total: allOrders.length,
        open: allOrders.filter(o => o.status === 'open').length,
        in_progress: allOrders.filter(o => o.status === 'in_progress').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ordens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema Ordi</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userProfile?.name || "Usuário"}
          </p>
          {userProfile?.role && (
            <p className="text-sm text-muted-foreground">
              Perfil: {userProfile.role === 'admin' ? 'Administrador' : 
                      userProfile.role === 'tecnico' ? 'Técnico' : 'Cliente Final'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {userProfile?.role === 'admin' && (
            <>
              <Link to="/users">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </Button>
              </Link>
              <Link to="/companies">
                <Button variant="outline">
                  <Building className="h-4 w-4 mr-2" />
                  Empresas
                </Button>
              </Link>
              <Link to="/clients">
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Clientes
                </Button>
              </Link>
              <Link to="/calls">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Chamados
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Ordens
                </Button>
              </Link>
              <Link to="/equipments">
                <Button variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Equipamentos
                </Button>
              </Link>
              <Link to="/technician">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Técnicos
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </Link>
            </>
          )}
          {userProfile?.role === 'admin_cliente' && (
            <>
              <Link to="/clients">
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Clientes
                </Button>
              </Link>
              <Link to="/calls">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Chamados
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Ordens
                </Button>
              </Link>
              <Link to="/equipments">
                <Button variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Equipamentos
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </Link>
            </>
          )}
          {userProfile?.role === 'cliente_final' && (
            <Link to="/calls">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Meus Chamados
              </Button>
            </Link>
          )}
          {(userProfile?.role === 'cliente_final') && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          )}
          {(userProfile?.role === 'admin' || userProfile?.role === 'admin_cliente') && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.open}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.in_progress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ordens Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada.</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira ordem
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.order_number}</span>
                        <Badge variant={getPriorityColor(order.priority) as any}>
                          {order.priority}
                        </Badge>
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium">{order.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Categoria: {order.category}</span>
                        <span>Criado em: {formatDate(order.created_at)}</span>
                        {order.due_date && (
                          <span>Prazo: {formatDate(order.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}