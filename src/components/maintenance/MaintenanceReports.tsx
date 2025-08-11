import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  Download, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KPIData {
  totalOrders: number;
  completedOrders: number;
  averageMTTR: number;
  preventiveCompliance: number;
  totalDowntime: number;
  emergencyRepairs: number;
  costByType: { type: string; cost: number; }[];
  ordersByStatus: { status: string; count: number; color: string; }[];
  monthlyTrend: { month: string; preventiva: number; corretiva: number; preditiva: number; }[];
}

export const MaintenanceReports = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const { toast } = useToast();

  const loadKPIData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get maintenance orders
      const { data: orders, error: ordersError } = await supabase
        .from("maintenance_orders")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate KPIs
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'concluida').length || 0;
      
      const mttrValues = orders?.filter(o => o.mttr_minutes).map(o => o.mttr_minutes) || [];
      const averageMTTR = mttrValues.length > 0 
        ? mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length 
        : 0;

      const preventiveOrders = orders?.filter(o => o.type === 'preventiva') || [];
      const preventiveCompleted = preventiveOrders.filter(o => o.status === 'concluida').length;
      const preventiveCompliance = preventiveOrders.length > 0 
        ? (preventiveCompleted / preventiveOrders.length) * 100 
        : 0;

      const totalDowntime = orders?.reduce((sum, order) => sum + (order.downtime_minutes || 0), 0) || 0;
      const emergencyRepairs = orders?.filter(o => o.type === 'corretiva' && o.priority === 'alta').length || 0;

      // Cost by type (simplified calculation)
      const costByType = [
        { type: 'Preventiva', cost: preventiveOrders.length * 500 },
        { type: 'Corretiva', cost: orders?.filter(o => o.type === 'corretiva').length * 1200 || 0 },
        { type: 'Preditiva', cost: orders?.filter(o => o.type === 'preditiva').length * 800 || 0 },
        { type: 'Detectiva', cost: orders?.filter(o => o.type === 'detectiva').length * 600 || 0 },
      ];

      // Orders by status
      const statusCounts = orders?.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number,
        color: getStatusColor(status)
      }));

      // Monthly trend (simplified)
      const monthlyTrend = [
        { month: 'Jan', preventiva: 12, corretiva: 8, preditiva: 3 },
        { month: 'Fev', preventiva: 15, corretiva: 6, preditiva: 4 },
        { month: 'Mar', preventiva: 18, corretiva: 5, preditiva: 6 },
        { month: 'Abr', preventiva: 14, corretiva: 9, preditiva: 2 },
        { month: 'Mai', preventiva: 16, corretiva: 7, preditiva: 5 },
        { month: 'Jun', preventiva: 20, corretiva: 4, preditiva: 7 },
      ];

      setKpiData({
        totalOrders,
        completedOrders,
        averageMTTR,
        preventiveCompliance,
        totalDowntime,
        emergencyRepairs,
        costByType,
        ordersByStatus,
        monthlyTrend,
      });

    } catch (error: any) {
      console.error("Erro ao carregar dados de KPI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIData();
  }, [selectedPeriod]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      planejada: "#3B82F6",
      aberta: "#F59E0B",
      em_execucao: "#F97316",
      aguardando_peca: "#8B5CF6",
      concluida: "#10B981",
      cancelada: "#EF4444",
    };
    return colors[status] || "#6B7280";
  };

  const exportReport = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exportação de relatórios será implementada em breve",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  if (!kpiData) {
    return <div className="text-center py-8">Nenhum dado disponível</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e KPIs de Manutenção</h2>
          <p className="text-muted-foreground">
            Análise de desempenho e indicadores de manutenção
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.completedOrders} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">MTTR Médio</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(kpiData.averageMTTR)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de reparo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conformidade PV</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(kpiData.preventiveCompliance)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Preventivas no prazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Emergenciais</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.emergencyRepairs}</div>
            <p className="text-xs text-muted-foreground">
              Reparos críticos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Custo por Tipo de Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiData.costByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Custo']} />
                <Bar dataKey="cost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kpiData.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {kpiData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Mensal por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="preventiva" stroke="#3B82F6" name="Preventiva" />
                <Line type="monotone" dataKey="corretiva" stroke="#EF4444" name="Corretiva" />
                <Line type="monotone" dataKey="preditiva" stroke="#10B981" name="Preditiva" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Downtime Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {Math.round(kpiData.totalDowntime / 60)}h
            </div>
            <p className="text-sm text-muted-foreground">
              {kpiData.totalDowntime} minutos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {kpiData.totalOrders > 0 
                ? Math.round((kpiData.completedOrders / kpiData.totalOrders) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              Ordens concluídas vs. total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {kpiData.totalDowntime > 0 
                ? Math.round((1 - kpiData.totalDowntime / (24 * 60 * parseInt(selectedPeriod))) * 100)
                : 100}%
            </div>
            <p className="text-sm text-muted-foreground">
              Disponibilidade média dos ativos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};