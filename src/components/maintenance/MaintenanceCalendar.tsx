import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceEvent {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduled_date: string;
  equipment_name: string;
  technician_name?: string;
}

export const MaintenanceCalendar = () => {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get events for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("maintenance_orders")
        .select(`
          *,
          equipments!equipment_id(name),
          profiles!technician_id(name)
        `)
        .gte("scheduled_date", startOfMonth.toISOString())
        .lte("scheduled_date", endOfMonth.toISOString())
        .not("scheduled_date", "is", null)
        .order("scheduled_date");

      if (error) throw error;

      const formattedEvents = data?.map((order: any) => ({
        id: order.id,
        title: order.title,
        type: order.type,
        status: order.status,
        scheduled_date: order.scheduled_date,
        equipment_name: order.equipments?.name || "N/A",
        technician_name: order.profiles?.name,
      })) || [];

      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("Erro ao carregar eventos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos do calendário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const getTypeColor = (type: string) => {
    const colors = {
      preventiva: "bg-blue-100 text-blue-800",
      preditiva: "bg-green-100 text-green-800",
      corretiva: "bg-red-100 text-red-800",
      detectiva: "bg-purple-100 text-purple-800",
      tempo: "bg-orange-100 text-orange-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planejada: "border-blue-500",
      aberta: "border-yellow-500",
      em_execucao: "border-orange-500",
      aguardando_peca: "border-purple-500",
      concluida: "border-green-500",
      cancelada: "border-red-500",
    };
    return colors[status as keyof typeof colors] || "border-gray-500";
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.scheduled_date);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const changeMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (loading) {
    return <div className="text-center py-8">Carregando calendário...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Manutenção
            </CardTitle>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth(-1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                ‹
              </button>
              <span className="font-semibold min-w-[180px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                ›
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-sm text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-1 border border-gray-200 ${
                    day ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium mb-1">{day}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`p-1 rounded text-xs border-l-2 ${getStatusColor(event.status)} bg-gray-50`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-xs ${getTypeColor(event.type)}`}>
                                {event.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events
              .filter(event => new Date(event.scheduled_date) >= new Date())
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-500">
                        {event.equipment_name} • {event.technician_name || "Não atribuído"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(event.scheduled_date).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.scheduled_date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </div>
              ))}
            {events.filter(event => new Date(event.scheduled_date) >= new Date()).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Nenhum evento agendado encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};