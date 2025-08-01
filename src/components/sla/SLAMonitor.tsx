import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, Bell, RefreshCw } from "lucide-react";

interface SLAAlert {
  order_id: string;
  title: string;
  client_name: string;
  technician_name: string;
  sla_status: string;
  remaining_hours: number;
}

export function SLAMonitor() {
  const [alerts, setAlerts] = useState<SLAAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSLAAlerts();
    
    // Atualizar alertas a cada 5 minutos
    const interval = setInterval(loadSLAAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSLAAlerts = async () => {
    try {
      setLoading(true);
      
      // Buscar ordens com dados de SLA usando SQL direto
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          title,
          status,
          scheduled_date,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(name)
        `)
        .in('status', ['pendente', 'em execução'])
        .not('scheduled_date', 'is', null);
      
      if (error) throw error;
      
      // Processar dados de SLA no frontend (usando SLA padrão de 24h)
      const defaultSLAHours = 24;
      const processedAlerts = data?.map(order => {
        const scheduledDate = new Date(order.scheduled_date);
        const now = new Date();
        const slaDeadline = new Date(scheduledDate.getTime() + (defaultSLAHours * 60 * 60 * 1000));
        const remainingMs = slaDeadline.getTime() - now.getTime();
        const remainingHours = remainingMs / (1000 * 60 * 60);
        
        let slaStatus = 'OK';
        if (remainingHours < 0) {
          slaStatus = 'ESTOURADO';
        } else if (remainingHours < 1) {
          slaStatus = 'CRITICO';
        } else if (remainingHours < 4) {
          slaStatus = 'ATENCAO';
        }
        
        return {
          order_id: order.id,
          title: order.title,
          client_name: order.client?.name || 'N/A',
          technician_name: order.technician?.name || 'Não atribuído',
          sla_status: slaStatus,
          remaining_hours: remainingHours
        };
      }).sort((a, b) => a.remaining_hours - b.remaining_hours) || [];
      
      setAlerts(processedAlerts);
      setLastUpdate(new Date());
      
      // Verificar se há alertas críticos para notificar
      const criticalAlerts = processedAlerts.filter(alert => 
        alert.sla_status === 'CRITICO' || alert.sla_status === 'ESTOURADO'
      );
      
      if (criticalAlerts.length > 0) {
        toast({
          title: "⚠️ Alertas de SLA",
          description: `${criticalAlerts.length} ordens precisam de atenção urgente!`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Erro ao carregar alertas SLA:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar alertas de SLA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'ESTOURADO': {
        className: "bg-red-500 text-white",
        icon: "🚨"
      },
      'CRITICO': {
        className: "bg-orange-500 text-white", 
        icon: "⚠️"
      },
      'ATENCAO': {
        className: "bg-yellow-500 text-white",
        icon: "⏰"
      },
      'OK': {
        className: "bg-green-500 text-white",
        icon: "✅"
      }
    };

    const config = configs[status as keyof typeof configs] || configs.OK;
    
    return (
      <Badge className={config.className}>
        {config.icon} {status}
      </Badge>
    );
  };

  const formatRemainingTime = (hours: number) => {
    if (hours < 0) {
      const overdue = Math.abs(hours);
      return `${overdue.toFixed(1)}h em atraso`;
    }
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}min restantes`;
    }
    
    return `${hours.toFixed(1)}h restantes`;
  };

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case 'ESTOURADO': return 'text-red-600';
      case 'CRITICO': return 'text-orange-600';
      case 'ATENCAO': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const criticalAlerts = alerts.filter(alert => 
    alert.sla_status === 'CRITICO' || alert.sla_status === 'ESTOURADO'
  );

  const attentionAlerts = alerts.filter(alert => alert.sla_status === 'ATENCAO');
  const okAlerts = alerts.filter(alert => alert.sla_status === 'OK');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitor de SLA</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do cumprimento de SLA
          </p>
        </div>
        <Button 
          onClick={loadSLAAlerts} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo dos Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Estourado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.sla_status === 'ESTOURADO').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crítico (&lt;1h)</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.sla_status === 'CRITICO').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção (&lt;4h)</CardTitle>
            <Bell className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.sla_status === 'ATENCAO').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Prazo</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.sla_status === 'OK').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {lastUpdate && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Última atualização: {lastUpdate.toLocaleString('pt-BR')}
            {' • '}
            Próxima atualização automática em 5 minutos
          </AlertDescription>
        </Alert>
      )}

      {/* Alertas Críticos */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos - Ação Urgente Necessária
            </CardTitle>
            <CardDescription>
              Ordens que estouraram o SLA ou estão prestes a estourar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalAlerts.map(alert => (
                  <TableRow key={alert.order_id} className="border-red-100">
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>{alert.client_name}</TableCell>
                    <TableCell>{alert.technician_name || 'Não atribuído'}</TableCell>
                    <TableCell>{getStatusBadge(alert.sla_status)}</TableCell>
                    <TableCell className={getSLAStatusColor(alert.sla_status)}>
                      {formatRemainingTime(alert.remaining_hours)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Atenção */}
      {attentionAlerts.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Atenção
            </CardTitle>
            <CardDescription>
              Ordens que precisam de acompanhamento próximo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attentionAlerts.map(alert => (
                  <TableRow key={alert.order_id}>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>{alert.client_name}</TableCell>
                    <TableCell>{alert.technician_name || 'Não atribuído'}</TableCell>
                    <TableCell>{getStatusBadge(alert.sla_status)}</TableCell>
                    <TableCell className={getSLAStatusColor(alert.sla_status)}>
                      {formatRemainingTime(alert.remaining_hours)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ordens no Prazo */}
      {okAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ordens no Prazo
            </CardTitle>
            <CardDescription>
              Ordens que estão dentro do SLA estabelecido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {okAlerts.slice(0, 10).map(alert => (
                  <TableRow key={alert.order_id}>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>{alert.client_name}</TableCell>
                    <TableCell>{alert.technician_name || 'Não atribuído'}</TableCell>
                    <TableCell>{getStatusBadge(alert.sla_status)}</TableCell>
                    <TableCell className={getSLAStatusColor(alert.sla_status)}>
                      {formatRemainingTime(alert.remaining_hours)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {okAlerts.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                E mais {okAlerts.length - 10} ordens no prazo...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma ordem ativa encontrada</h3>
            <p className="text-muted-foreground">
              Não há ordens em andamento para monitorar SLA no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}