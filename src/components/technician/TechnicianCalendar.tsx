import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, Filter, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth, isToday, getDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TechnicianScheduleModal } from "./TechnicianScheduleModal";
import { cn } from "@/lib/utils";

interface ScheduleOrder {
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: "pendente" | "em execução" | "concluída" | "cancelada" | "atrasada" | "pendente_finalizacao";
  priority: "baixa" | "média" | "alta";
  technician_id: string;
  technician_name: string;
  description: string;
  client_id: string;
}

interface Technician {
  id: string;
  name: string;
}

export function TechnicianCalendar() {
  const [orders, setOrders] = useState<ScheduleOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ScheduleOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  useEffect(() => {
    loadTechnicians();
    loadOrders();
  }, [selectedTechnician, currentDate]);

  const loadTechnicians = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "tecnico")
        .eq("active", true);

      setTechnicians(data || []);
    } catch (error) {
      console.error("Erro ao carregar técnicos:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      let query = supabase
        .from("orders")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          scheduled_date,
          client_id,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(id, name)
        `)
        .not("scheduled_date", "is", null)
        .gte("scheduled_date", monthStart.toISOString())
        .lte("scheduled_date", monthEnd.toISOString());

      if (selectedTechnician !== "all") {
        query = query.eq("technician_id", selectedTechnician);
      }

      const { data } = await query.order("scheduled_date");

      const formattedData: ScheduleOrder[] = data?.map(item => {
        // Determinar status com base na data e status atual
        let finalStatus = item.status;
        const now = new Date();
        const scheduledDate = new Date(item.scheduled_date);
        
        if (item.status === "pendente" && scheduledDate < now) {
          finalStatus = "atrasada" as any;
        } else if (item.status === "em execução") {
          finalStatus = "em execução";
        } else if (item.status === "concluída") {
          finalStatus = "concluída";
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          client_name: item.client?.name || "N/A",
          scheduled_date: item.scheduled_date,
          status: finalStatus as ScheduleOrder["status"],
          priority: item.priority,
          technician_id: item.technician?.id || "",
          technician_name: item.technician?.name || "Não atribuído",
          client_id: item.client_id
        };
      }) || [];

      setOrders(formattedData);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atrasada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em execução':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concluída':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente_finalizacao':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return '🔵';
      case 'atrasada':
        return '🔴';
      case 'em execução':
        return '🟡';
      case 'concluída':
        return '🟢';
      case 'pendente_finalizacao':
        return '🟣';
      default:
        return '⚪';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500 text-white';
      case 'média':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getOrdersForDay = (day: Date) => {
    return orders.filter(order => isSameDay(new Date(order.scheduled_date), day));
  };

  const handleOrderClick = (order: ScheduleOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const handleOrderSuccess = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
    loadOrders();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando agenda...</div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Agenda dos Técnicos
            </h2>
            <p className="text-muted-foreground">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os técnicos</SelectItem>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Calendário
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              Lista
            </Button>
          </div>

          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar tarefa
          </Button>
        </div>
      </div>

      {/* Legenda de Status */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>🔵</span>
              <span>Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>Atrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟡</span>
              <span>Em execução</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟢</span>
              <span>Finalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟣</span>
              <span>Pendente finalização</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "month" ? (
        /* Calendário Mensal */
        <Card>
          <CardContent className="p-4">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Grade do calendário */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayOrders = getOrdersForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[120px] p-2 border rounded-lg",
                      isCurrentMonth ? "bg-background" : "bg-muted/30",
                      isDayToday && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-2",
                      !isCurrentMonth && "text-muted-foreground",
                      isDayToday && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                    </div>

                    <div className="space-y-1">
                      {dayOrders.slice(0, 3).map(order => (
                        <div
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className={cn(
                            "text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow",
                            getStatusColor(order.status)
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span>{getStatusIcon(order.status)}</span>
                            <span className="truncate font-medium">
                              {format(new Date(order.scheduled_date), "HH:mm")}
                            </span>
                          </div>
                          <div className="truncate">{order.title}</div>
                          <div className="truncate text-xs opacity-75">
                            {order.client_name}
                          </div>
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{dayOrders.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Lista de Ordens */
        <div className="space-y-3">
          {orders.map(order => (
            <Card 
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getStatusIcon(order.status)}</span>
                      <h3 className="font-semibold">{order.title}</h3>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(order.scheduled_date), "dd/MM/yyyy 'às' HH:mm")}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {order.client_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {order.technician_name}
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'pendente').length}
              </p>
              <p className="text-sm text-muted-foreground">Agendadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {orders.filter(o => o.status === 'atrasada').length}
              </p>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'em execução').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Execução</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'concluída').length}
              </p>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Ordem */}
      <TechnicianScheduleModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        order={selectedOrder}
        onOrderUpdate={handleOrderSuccess}
      />
    </div>
  );
}