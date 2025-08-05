import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Users, Building, UserCheck, ClipboardList, Wrench, BarChart, Settings, Shield, Download, MapPin, Calendar, Star, ChevronDown, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { SupervisorPanel } from "@/components/dashboard/SupervisorPanel";
import { ExportTools } from "@/components/reports/ExportTools";
import { SLAMonitor } from "@/components/sla/SLAMonitor";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { TechnicianSchedule } from "@/components/schedule/TechnicianSchedule";
import { ServiceEvaluation } from "@/components/evaluation/ServiceEvaluation";
import { EquipmentHistory } from "@/components/equipment/EquipmentHistory";
import { RBACManager } from "@/components/rbac/RBACManager";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
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
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOrders(), fetchUserProfile()]);
    };
    loadData();
  }, []);
  const fetchUserProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: profile
        } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };
  const fetchOrders = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('service_orders').select('*').order('created_at', {
        ascending: false
      }).limit(10);
      if (error) throw error;
      setOrders(data || []);

      // Calcular estatísticas
      const allOrders = data || [];
      setStats({
        total: allOrders.length,
        open: allOrders.filter(o => o.status === 'open').length,
        in_progress: allOrders.filter(o => o.status === 'in_progress').length,
        completed: allOrders.filter(o => o.status === 'completed').length
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ordens",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>;
  }
  return <AuthLayout>
      <div className="space-y-4 sm:space-y-6">
      {/* Header Simplificado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard - Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userProfile?.name || "Usuário"}
          </p>
           {userProfile?.role && <p className="text-sm text-muted-foreground">
               Perfil: {userProfile.role === 'admin_master' ? 'Admin Master' : userProfile.role === 'admin' ? 'Administrador' : userProfile.role === 'admin_cliente' ? 'Admin Cliente' : userProfile.role === 'gestor' ? 'Gestor' : userProfile.role === 'tecnico' ? 'Técnico' : 'Cliente Final'}
             </p>}
        </div>
      </div>

      {/* Dashboard específico por tipo de usuário */}
      {userProfile?.role === 'admin_master' || userProfile?.role === 'admin' || userProfile?.role === 'admin_cliente' || userProfile?.role === 'gestor' ? <div className="space-y-4 sm:space-y-6">
          {/* Header com menu dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              
              
              {/* Menu Principal */}
              <div className="flex items-center gap-2">
                <Button variant={activeTab === "overview" ? "default" : "outline"} onClick={() => setActiveTab("overview")} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visão Geral
                </Button>
                
                {/* Dropdown para Supervisão e Monitoramento */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Supervisão
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Supervisão e Monitoramento</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab("supervision")}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Painel Supervisor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("sla")}>
                      <Shield className="mr-2 h-4 w-4" />
                      SLA & Alertas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("map")}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Mapa Interativo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("schedule")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Agenda Técnicos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Dropdown para Relatórios e Análises */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Relatórios
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Relatórios e Análises</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab("reports")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Dados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("evaluation")}>
                      <Star className="mr-2 h-4 w-4" />
                      Avaliações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("equipment-history")}>
                      <Clock className="mr-2 h-4 w-4" />
                      Histórico Equipamentos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Dropdown para Configurações */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configurações
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Configurações do Sistema</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab("rbac")}>
                      <Users className="mr-2 h-4 w-4" />
                      Controle de Acesso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("admin-settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações do Sistema
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Conteúdo das abas */}
          <div className="space-y-6">

            {activeTab === "supervision" && <SupervisorPanel />}
            {activeTab === "sla" && <SLAMonitor />}
            {activeTab === "reports" && <ExportTools />}
            {activeTab === "map" && <InteractiveMap />}
            {activeTab === "schedule" && <TechnicianSchedule />}
            {activeTab === "evaluation" && <ServiceEvaluation />}
            {activeTab === "equipment-history" && <EquipmentHistory />}
            {activeTab === "rbac" && <RBACManager />}
            {activeTab === "admin-settings" && <AdminSettings />}
            
            {activeTab === "overview" && <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total de Ordens</CardTitle>
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Abertas</CardTitle>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-destructive">{stats.open}</div>
              </CardContent>
            </Card>
              
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Em Progresso</CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-primary">{stats.in_progress}</div>
              </CardContent>
            </Card>
              
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            </div>

            {/* Lista de Ordens Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Ordens Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada.</p>
                     <Button 
                       className="mt-4"
                       onClick={() => setShowTaskModal(true)}
                     >
                       <Plus className="h-4 w-4 mr-2" />
                       Criar primeira ordem
                     </Button>
                  </div> : <div className="space-y-4">
                    {orders.map(order => <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
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
                              {order.due_date && <span>Prazo: {formatDate(order.due_date)}</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>
              </div>}
          </div>
        </div> :
      // Dashboard para cliente final e técnicos (visão simples)
      <>
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
              {orders.length === 0 ? <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira ordem
                  </Button>
                </div> : <div className="space-y-4">
                  {orders.map(order => <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
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
                            {order.due_date && <span>Prazo: {formatDate(order.due_date)}</span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </>}
      </div>

      {/* Modal Nova Ordem */}
      <TaskFormModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onSuccess={() => {
          setShowTaskModal(false);
          fetchOrders(); // Recarregar as ordens após criar uma nova
        }}
      />
    </AuthLayout>;
}