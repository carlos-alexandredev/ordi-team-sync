import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, Clock, TrendingUp, Users, Wrench, CheckCircle } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

interface ReportData {
  totalOrders: number;
  completedOrders: number;
  averageTime: number;
  clientSatisfaction: number;
  ordersByStatus: Array<{ name: string; value: number; color: string }>;
  ordersByPriority: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; orders: number; completed: number }>;
  technicianPerformance: Array<{ name: string; orders: number; avgTime: number; satisfaction: number }>;
}

export const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadReportData();
    }
  }, [dateRange, selectedCompany]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('active', true);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          status,
          priority,
          created_at,
          execution_date,
          company_id,
          profiles!orders_technician_id_fkey(name),
          order_time_logs(total_minutes)
        `)
        .gte('created_at', dateRange?.from?.toISOString())
        .lte('created_at', dateRange?.to?.toISOString());

      if (selectedCompany !== 'all') {
        ordersQuery = ordersQuery.eq('company_id', selectedCompany);
      }

      const { data: orders, error } = await ordersQuery;
      if (error) throw error;

      // Processar dados para o relatório
      const processedData = processOrdersData(orders || []);
      setReportData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const processOrdersData = (orders: any[]): ReportData => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'concluída').length;

    // Calcular tempo médio
    const timeLogs = orders.flatMap(o => o.order_time_logs || []);
    const totalMinutes = timeLogs.reduce((acc, log) => acc + (log.total_minutes || 0), 0);
    const averageTime = timeLogs.length > 0 ? totalMinutes / timeLogs.length : 0;

    // Satisfação do cliente simulada (seria buscada dos questionários)
    const clientSatisfaction = 4.2;

    // Ordens por status
    const statusCount = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count as number,
      color: getStatusColor(status)
    }));

    // Ordens por prioridade
    const priorityCount = orders.reduce((acc, order) => {
      acc[order.priority] = (acc[order.priority] || 0) + 1;
      return acc;
    }, {});

    const ordersByPriority = Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority,
      value: count as number
    }));

    // Tendência mensal (últimos 6 meses)
    const monthlyTrend = generateMonthlyTrend(orders);

    // Performance de técnicos
    const technicianPerformance = generateTechnicianPerformance(orders);

    return {
      totalOrders,
      completedOrders,
      averageTime,
      clientSatisfaction,
      ordersByStatus,
      ordersByPriority,
      monthlyTrend,
      technicianPerformance
    };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': '#f59e0b',
      'em execução': '#3b82f6',
      'concluída': '#10b981',
      'cancelada': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const generateMonthlyTrend = (orders: any[]) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = addDays(new Date(), -30 * i);
      const monthName = format(date, 'MMM');
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === date.getMonth();
      });

      months.push({
        month: monthName,
        orders: monthOrders.length,
        completed: monthOrders.filter(o => o.status === 'concluída').length
      });
    }
    return months;
  };

  const generateTechnicianPerformance = (orders: any[]) => {
    const technicianData = orders.reduce((acc, order) => {
      const techName = order.profiles?.name || 'Não atribuído';
      if (!acc[techName]) {
        acc[techName] = { orders: 0, totalTime: 0, timeCount: 0 };
      }
      acc[techName].orders++;
      
      const orderTime = order.order_time_logs?.reduce((sum, log) => sum + (log.total_minutes || 0), 0) || 0;
      if (orderTime > 0) {
        acc[techName].totalTime += orderTime;
        acc[techName].timeCount++;
      }
      
      return acc;
    }, {});

    return Object.entries(technicianData).map(([name, data]: [string, any]) => ({
      name,
      orders: data.orders,
      avgTime: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount) : 0,
      satisfaction: 4.0 + Math.random() * 1 // Simulado
    }));
  };

  if (loading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Relatórios e Análises
        </h1>
        
        <div className="flex items-center gap-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Ordens</p>
                <p className="text-2xl font-bold">{reportData?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{reportData?.completedOrders || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {reportData?.totalOrders ? Math.round((reportData.completedOrders / reportData.totalOrders) * 100) : 0}% do total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {Math.round((reportData?.averageTime || 0) / 60)}h {Math.round((reportData?.averageTime || 0) % 60)}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Satisfação</p>
                <p className="text-2xl font-bold">{reportData?.clientSatisfaction?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-muted-foreground">de 5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Ordens */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.ordersByStatus || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {reportData?.ordersByStatus?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Prioridades */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.ordersByPriority || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendência Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance dos Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData?.technicianPerformance?.map((tech, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tech.orders} ordens • Tempo médio: {Math.round(tech.avgTime / 60)}h {tech.avgTime % 60}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    ⭐ {tech.satisfaction.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};