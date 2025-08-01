import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Wrench, AlertTriangle, CheckCircle, Activity, Clock, Filter } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";

interface EquipmentHistoryItem {
  id: string;
  equipment_id: string;
  equipment_name: string;
  event_type: 'manutenção' | 'falha' | 'instalação' | 'substituição' | 'inspeção';
  description: string;
  order_title?: string;
  technician_name?: string;
  date: string;
  status: string;
  cost?: number;
  duration_hours?: number;
}

interface Equipment {
  id: string;
  name: string;
  model?: string;
  status: string;
}

export function EquipmentHistory() {
  const [historyItems, setHistoryItems] = useState<EquipmentHistoryItem[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipments();
    loadHistory();
  }, [selectedEquipment, selectedEventType, dateRange]);

  const loadEquipments = async () => {
    try {
      const { data } = await supabase
        .from("equipments")
        .select("id, name, model, status")
        .order("name");

      setEquipments(data || []);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    }
  };

  const loadHistory = async () => {
    try {
      // Simulando dados do histórico baseado nas ordens e equipamentos
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          id,
          title,
          execution_date,
          created_at,
          status,
          technician:profiles!orders_technician_id_fkey(name)
        `)
        .not("execution_date", "is", null);

      if (error) {
        console.error("Database error:", error);
        return;
      }

      // Transformar dados em histórico (simulação)
      const historyData: EquipmentHistoryItem[] = [];
      
      
      // Simular dados de histórico para cada equipamento
      const equipmentsData = await supabase
        .from("equipments")
        .select("id, name")
        .limit(5);

      equipmentsData.data?.forEach((equipment, index) => {
        ordersData?.forEach(order => {
          if (Math.random() > 0.7) { // Simular que nem todas as ordens têm esse equipamento
            const eventTypes: EquipmentHistoryItem['event_type'][] = ['manutenção', 'falha', 'instalação', 'substituição', 'inspeção'];
            const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            
            if (!selectedEquipment || selectedEquipment === "all" || equipment.id === selectedEquipment) {
              if (selectedEventType === "all" || randomEventType === selectedEventType) {
                historyData.push({
                  id: `${order.id}-${equipment.id}`,
                  equipment_id: equipment.id,
                  equipment_name: equipment.name,
                  event_type: randomEventType,
                  description: `${randomEventType} realizada - ${order.title}`,
                  order_title: order.title,
                  technician_name: order.technician?.name || "N/A",
                  date: order.execution_date || order.created_at,
                  status: order.status,
                  duration_hours: Math.floor(Math.random() * 8) + 1
                });
              }
            }
          }
        });
      });

      // Filtrar por data se especificado
      let filteredData = historyData;
      if (dateRange?.from && dateRange?.to) {
        filteredData = historyData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
        });
      }

      // Ordenar por data mais recente
      filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistoryItems(filteredData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'manutenção':
        return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'falha':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'instalação':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'substituição':
        return <Activity className="h-4 w-4 text-orange-600" />;
      case 'inspeção':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'manutenção':
        return 'bg-blue-100 text-blue-800';
      case 'falha':
        return 'bg-red-100 text-red-800';
      case 'instalação':
        return 'bg-green-100 text-green-800';
      case 'substituição':
        return 'bg-orange-100 text-orange-800';
      case 'inspeção':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluída':
        return 'bg-green-100 text-green-800';
      case 'em execução':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeStats = () => {
    const stats = {
      manutenção: historyItems.filter(item => item.event_type === 'manutenção').length,
      falha: historyItems.filter(item => item.event_type === 'falha').length,
      instalação: historyItems.filter(item => item.event_type === 'instalação').length,
      substituição: historyItems.filter(item => item.event_type === 'substituição').length,
      inspeção: historyItems.filter(item => item.event_type === 'inspeção').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando histórico...</div>
      </div>
    );
  }

  const stats = getEventTypeStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Histórico de Equipamentos</h2>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Exportar Histórico
        </Button>
      </div>

      {/* Estatísticas por Tipo de Evento */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.manutenção}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.falha}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalações</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.instalação}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Substituições</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.substituição}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspeções</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inspeção}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Equipamento</label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os equipamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os equipamentos</SelectItem>
                  {equipments.map(equipment => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name} {equipment.model && `- ${equipment.model}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Evento</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="manutenção">Manutenção</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                  <SelectItem value="instalação">Instalação</SelectItem>
                  <SelectItem value="substituição">Substituição</SelectItem>
                  <SelectItem value="inspeção">Inspeção</SelectItem>
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
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Registro completo de eventos dos equipamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Nenhum evento encontrado para os filtros selecionados.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(item.date).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleTimeString("pt-BR", {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.equipment_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(item.event_type)}
                        <Badge className={getEventTypeColor(item.event_type)}>
                          {item.event_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={item.description}>
                        {item.description}
                      </div>
                      {item.order_title && (
                        <div className="text-xs text-muted-foreground">
                          OS: {item.order_title}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.technician_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{item.duration_hours}h</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}