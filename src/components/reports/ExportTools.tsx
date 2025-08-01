import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, BarChart3 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ExportConfig {
  type: 'orders' | 'calls' | 'technician_productivity';
  format: 'csv' | 'pdf';
  dateRange?: DateRange;
  filters?: {
    status?: string;
    client?: string;
    technician?: string;
  };
}

export function ExportTools() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportType, setReportType] = useState<string>("");
  const [format, setFormat] = useState<string>("csv");
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar no período selecionado.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOrdersReport = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("orders")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          scheduled_date,
          execution_date,
          created_at,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(name),
          company:companies(name)
        `);

      if (dateRange?.from) {
        query = query.gte('scheduled_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('scheduled_date', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(order => ({
        ID: order.id,
        Título: order.title,
        Descrição: order.description,
        Status: order.status,
        Prioridade: order.priority,
        Cliente: order.client?.name || 'N/A',
        Técnico: order.technician?.name || 'N/A',
        Empresa: order.company?.name || 'N/A',
        'Data Agendada': order.scheduled_date 
          ? new Date(order.scheduled_date).toLocaleDateString('pt-BR')
          : 'N/A',
        'Data Execução': order.execution_date 
          ? new Date(order.execution_date).toLocaleDateString('pt-BR')
          : 'N/A',
        'Data Criação': new Date(order.created_at).toLocaleDateString('pt-BR')
      })) || [];

      const filename = `relatorio_ordens_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(formattedData, filename);
      } else {
        // TODO: Implementar PDF
        toast({
          title: "Em desenvolvimento",
          description: "Exportação em PDF será implementada em breve.",
        });
      }

      toast({
        title: "Relatório gerado",
        description: `Relatório de ordens exportado com ${formattedData.length} registros.`,
      });

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de ordens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCallsReport = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("calls")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          updated_at,
          client:profiles!calls_client_id_fkey(name),
          company:companies(name)
        `);

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(call => ({
        ID: call.id,
        Título: call.title,
        Descrição: call.description,
        Status: call.status,
        Prioridade: call.priority,
        Cliente: call.client?.name || 'N/A',
        Empresa: call.company?.name || 'N/A',
        'Data Abertura': new Date(call.created_at).toLocaleDateString('pt-BR'),
        'Última Atualização': new Date(call.updated_at).toLocaleDateString('pt-BR')
      })) || [];

      const filename = `relatorio_chamados_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(formattedData, filename);
      }

      toast({
        title: "Relatório gerado",
        description: `Relatório de chamados exportado com ${formattedData.length} registros.`,
      });

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de chamados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTechnicianProductivityReport = async () => {
    try {
      setLoading(true);
      
      // Buscar dados de produtividade dos técnicos
      let ordersQuery = supabase
        .from("orders")
        .select(`
          id,
          status,
          scheduled_date,
          execution_date,
          technician:profiles!orders_technician_id_fkey(name, id)
        `)
        .not('technician_id', 'is', null);

      if (dateRange?.from) {
        ordersQuery = ordersQuery.gte('scheduled_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        ordersQuery = ordersQuery.lte('scheduled_date', dateRange.to.toISOString());
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Buscar dados de tempo dos técnicos
      let timeLogsQuery = supabase
        .from("order_time_logs")
        .select(`
          order_id,
          technician_id,
          check_in_time,
          check_out_time,
          total_minutes
        `);

      const { data: timeLogsData, error: timeLogsError } = await timeLogsQuery;
      if (timeLogsError) throw timeLogsError;

      // Processar dados de produtividade
      const technicianStats: { [key: string]: any } = {};

      ordersData?.forEach(order => {
        const techName = order.technician?.name;
        if (!techName) return;

        if (!technicianStats[techName]) {
          technicianStats[techName] = {
            nome: techName,
            total_ordens: 0,
            ordens_concluidas: 0,
            ordens_pendentes: 0,
            ordens_em_andamento: 0,
            tempo_total_minutos: 0,
            tempo_medio_dias: 0
          };
        }

        technicianStats[techName].total_ordens++;
        
        if (order.status === 'concluída') {
          technicianStats[techName].ordens_concluidas++;
        } else if (order.status === 'pendente') {
          technicianStats[techName].ordens_pendentes++;
        } else if (order.status === 'em execução') {
          technicianStats[techName].ordens_em_andamento++;
        }
      });

      // Adicionar dados de tempo
      timeLogsData?.forEach(log => {
        if (log.total_minutes) {
          // Encontrar o técnico correspondente
          const orderTech = ordersData?.find(o => o.id === log.order_id)?.technician?.name;
          if (orderTech && technicianStats[orderTech]) {
            technicianStats[orderTech].tempo_total_minutos += log.total_minutes;
          }
        }
      });

      // Calcular médias
      Object.keys(technicianStats).forEach(techName => {
        const stats = technicianStats[techName];
        if (stats.ordens_concluidas > 0) {
          stats.tempo_medio_dias = Math.round((stats.tempo_total_minutos / (60 * 24)) / stats.ordens_concluidas * 10) / 10;
        }
        stats.taxa_conclusao = stats.total_ordens > 0 
          ? Math.round((stats.ordens_concluidas / stats.total_ordens) * 100) + '%'
          : '0%';
      });

      const formattedData = Object.values(technicianStats).map((stats: any) => ({
        Técnico: stats.nome,
        'Total Ordens': stats.total_ordens,
        'Ordens Concluídas': stats.ordens_concluidas,
        'Ordens Pendentes': stats.ordens_pendentes,
        'Ordens em Andamento': stats.ordens_em_andamento,
        'Taxa de Conclusão': stats.taxa_conclusao,
        'Tempo Médio (dias)': stats.tempo_medio_dias,
        'Tempo Total (horas)': Math.round(stats.tempo_total_minutos / 60)
      }));

      const filename = `relatorio_produtividade_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(formattedData, filename);
      }

      toast({
        title: "Relatório gerado",
        description: `Relatório de produtividade exportado com ${formattedData.length} técnicos.`,
      });

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de produtividade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    switch (reportType) {
      case 'orders':
        generateOrdersReport();
        break;
      case 'calls':
        generateCallsReport();
        break;
      case 'technician_productivity':
        generateTechnicianProductivityReport();
        break;
      default:
        toast({
          title: "Selecione um tipo de relatório",
          description: "Escolha o tipo de relatório que deseja gerar.",
          variant: "destructive",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Relatórios e Exportações
        </CardTitle>
        <CardDescription>
          Gere relatórios detalhados em CSV ou PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Ordens de Serviço</SelectItem>
                <SelectItem value="calls">Chamados</SelectItem>
                <SelectItem value="technician_productivity">Produtividade por Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Formato</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF (Em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Período</label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleExport}
            disabled={loading || !reportType}
            className="flex items-center gap-2"
          >
            {loading ? (
              "Gerando..."
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar Relatório
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <h4 className="font-medium">Ordens de Serviço</h4>
                <p className="text-sm text-muted-foreground">
                  Relatório completo com status, datas e responsáveis
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <h4 className="font-medium">Chamados</h4>
                <p className="text-sm text-muted-foreground">
                  Histórico de chamados por cliente e tipo
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <h4 className="font-medium">Produtividade</h4>
                <p className="text-sm text-muted-foreground">
                  Ranking e métricas por técnico
                </p>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}