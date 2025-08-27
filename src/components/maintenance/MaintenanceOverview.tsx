import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  TrendingUp,
  Target
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OverviewStats {
  totalOrders: number;
  openOrders: number;
  completedOrders: number;
  overdueOrders: number;
  mttr: number;
  slaCompliance: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export const MaintenanceOverview = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalOrders: 0,
    openOrders: 0,
    completedOrders: 0,
    overdueOrders: 0,
    mttr: 0,
    slaCompliance: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas das ordens de manutenção
      const { data: ordersData, error } = await supabase
        .from("maintenance_orders")
        .select("*");

      if (error) throw error;

      const totalOrders = ordersData?.length || 0;
      const openOrders = ordersData?.filter(order => 
        !['concluida', 'cancelada'].includes(order.status)
      ).length || 0;
      const completedOrders = ordersData?.filter(order => 
        order.status === 'concluida'
      ).length || 0;
      const overdueOrders = ordersData?.filter(order => 
        order.scheduled_date && 
        new Date(order.scheduled_date) < new Date() && 
        order.status !== 'concluida'
      ).length || 0;

      // Calcular MTTR médio (simulado por enquanto)
      const completedWithMttr = ordersData?.filter(order => 
        order.status === 'concluida' && order.mttr_minutes
      ) || [];
      const mttr = completedWithMttr.length > 0 
        ? completedWithMttr.reduce((acc, order) => acc + (order.mttr_minutes || 0), 0) / completedWithMttr.length
        : 0;

      // Calcular compliance SLA (simulado)
      const slaCompliance = totalOrders > 0 ? Math.round(((completedOrders + openOrders - overdueOrders) / totalOrders) * 100) : 0;

      setStats({
        totalOrders,
        openOrders,
        completedOrders,
        overdueOrders,
        mttr: Math.round(mttr),
        slaCompliance
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const priorityData: ChartData[] = [
    { name: "Alta", value: 25, color: "#ef4444" },
    { name: "Média", value: 45, color: "#f59e0b" },
    { name: "Baixa", value: 30, color: "#10b981" }
  ];

  const statusData: ChartData[] = [
    { name: "Abertas", value: stats.openOrders, color: "#3b82f6" },
    { name: "Concluídas", value: stats.completedOrders, color: "#10b981" },
    { name: "Em Atraso", value: stats.overdueOrders, color: "#ef4444" }
  ];

  if (loading) {
    return <div className="text-center py-8">Carregando visão geral...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens Abertas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openOrders}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalOrders} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueOrders}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mttr}min</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de reparo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% SLA Cumprido</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.slaCompliance}%</div>
            <div className="mt-2">
              <Badge variant={stats.slaCompliance >= 80 ? "default" : "destructive"}>
                {stats.slaCompliance >= 80 ? "Dentro da meta" : "Abaixo da meta"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12%</div>
            <p className="text-xs text-muted-foreground">
              Melhoria vs. mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
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
    </div>
  );
};