import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";

interface OrderStats {
  total: number;
  pendente: number;
  em_andamento: number;
  concluido: number;
  atrasado: number;
}

interface TechnicianStats {
  id: string;
  name: string;
  orders_count: number;
  avg_completion_time: number;
}

interface Order {
  id: string;
  title: string;
  status: string;
  priority: string;
  client_name: string;
  technician_name: string;
  scheduled_date: string;
  execution_date: string;
  company_name: string;
}

export function SupervisorPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pendente: 0,
    em_andamento: 0,
    concluido: 0,
    atrasado: 0
  });
  const [technicianStats, setTechnicianStats] = useState<TechnicianStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Dados para filtros
  const [clients, setClients] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadFilterData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, clientFilter, technicianFilter, dateRange]);

  const loadData = async () => {
    try {
      // Carregar ordens com dados relacionados
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(name),
          company:companies(name)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders = ordersData?.map(order => ({
        id: order.id,
        title: order.title,
        status: order.status,
        priority: order.priority,
        client_name: order.client?.name || "N/A",
        technician_name: order.technician?.name || "Não atribuído",
        scheduled_date: order.scheduled_date,
        execution_date: order.execution_date,
        company_name: order.company?.name || "N/A"
      })) || [];

      setOrders(formattedOrders);
      calculateStats(formattedOrders);
      calculateTechnicianStats(formattedOrders);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterData = async () => {
    try {
      // Carregar clientes
      const { data: clientsData } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "cliente_final");

      // Carregar técnicos
      const { data: techniciansData } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "tecnico");

      setClients(clientsData || []);
      setTechnicians(techniciansData || []);
    } catch (error) {
      console.error("Erro ao carregar dados dos filtros:", error);
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const now = new Date();
    const stats = {
      total: ordersData.length,
      pendente: ordersData.filter(o => o.status === "pendente").length,
      em_andamento: ordersData.filter(o => o.status === "em_andamento").length,
      concluido: ordersData.filter(o => o.status === "concluido").length,
      atrasado: ordersData.filter(o => {
        const scheduledDate = new Date(o.scheduled_date);
        return scheduledDate < now && o.status !== "concluido";
      }).length
    };
    setStats(stats);
  };

  const calculateTechnicianStats = (ordersData: Order[]) => {
    const techStats: { [key: string]: { name: string; orders: Order[] } } = {};
    
    ordersData.forEach(order => {
      if (order.technician_name && order.technician_name !== "Não atribuído") {
        if (!techStats[order.technician_name]) {
          techStats[order.technician_name] = {
            name: order.technician_name,
            orders: []
          };
        }
        techStats[order.technician_name].orders.push(order);
      }
    });

    const stats = Object.keys(techStats).map(techName => {
      const completedOrders = techStats[techName].orders.filter(o => o.status === "concluido");
      const avgTime = completedOrders.length > 0 
        ? completedOrders.reduce((acc, order) => {
            if (order.scheduled_date && order.execution_date) {
              const start = new Date(order.scheduled_date).getTime();
              const end = new Date(order.execution_date).getTime();
              return acc + (end - start) / (1000 * 60 * 60 * 24); // dias
            }
            return acc;
          }, 0) / completedOrders.length
        : 0;

      return {
        id: techName,
        name: techName,
        orders_count: techStats[techName].orders.length,
        avg_completion_time: Math.round(avgTime * 10) / 10
      };
    }).sort((a, b) => b.orders_count - a.orders_count);

    setTechnicianStats(stats);
  };

  const filterOrders = () => {
    // Esta função será chamada automaticamente pelos useEffect
    // quando os filtros mudarem
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "default",
      em_andamento: "secondary", 
      concluido: "default",
      cancelado: "destructive"
    };
    
    const colors = {
      pendente: "bg-yellow-100 text-yellow-800",
      em_andamento: "bg-blue-100 text-blue-800",
      concluido: "bg-green-100 text-green-800", 
      cancelado: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      baixa: "bg-green-100 text-green-800",
      média: "bg-yellow-100 text-yellow-800",
      alta: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Painel de Supervisão</h2>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.em_andamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluido}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atrasado}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cliente</Label>
              <Select value={clientFilter || "all"} onValueChange={(value) => setClientFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Técnico</Label>
              <Select value={technicianFilter || "all"} onValueChange={(value) => setTechnicianFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os técnicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.name}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Período</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Produtividade</CardTitle>
          <CardDescription>Técnicos com maior volume e tempo médio de conclusão</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Ordens</TableHead>
                <TableHead>Tempo Médio (dias)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicianStats.slice(0, 10).map((tech, index) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">
                    #{index + 1} {tech.name}
                  </TableCell>
                  <TableCell>{tech.orders_count}</TableCell>
                  <TableCell>{tech.avg_completion_time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lista de Ordens */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data Agendada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders
                .filter(order => {
                  if (statusFilter && order.status !== statusFilter) return false;
                  if (clientFilter && order.client_name !== clientFilter) return false;
                  if (technicianFilter && order.technician_name !== technicianFilter) return false;
                  if (dateRange?.from && dateRange?.to) {
                    const orderDate = new Date(order.scheduled_date);
                    if (orderDate < dateRange.from || orderDate > dateRange.to) return false;
                  }
                  return true;
                })
                .slice(0, 50)
                .map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.title}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{order.technician_name}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>
                      {order.scheduled_date 
                        ? new Date(order.scheduled_date).toLocaleDateString("pt-BR")
                        : "N/A"
                      }
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}