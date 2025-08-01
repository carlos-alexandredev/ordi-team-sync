import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduleItem {
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: string;
  priority: string;
  technician_id: string;
  technician_name: string;
}

interface Technician {
  id: string;
  name: string;
}

export function TechnicianSchedule() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicians();
    loadSchedule();
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

  const loadSchedule = async () => {
    try {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDate, { locale: ptBR });

      let query = supabase
        .from("orders")
        .select(`
          id,
          title,
          status,
          priority,
          scheduled_date,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(id, name)
        `)
        .not("scheduled_date", "is", null)
        .gte("scheduled_date", weekStart.toISOString())
        .lte("scheduled_date", weekEnd.toISOString());

      if (selectedTechnician !== "all") {
        query = query.eq("technician_id", selectedTechnician);
      }

      const { data } = await query.order("scheduled_date");

      const formattedData: ScheduleItem[] = data?.map(item => ({
        id: item.id,
        title: item.title,
        client_name: item.client?.name || "N/A",
        scheduled_date: item.scheduled_date,
        status: item.status,
        priority: item.priority,
        technician_id: item.technician?.id || "",
        technician_name: item.technician?.name || "Não atribuído"
      })) || [];

      setScheduleItems(formattedData);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate, { locale: ptBR })
    });
  };

  const getItemsForDay = (day: Date) => {
    return scheduleItems.filter(item => 
      isSameDay(new Date(item.scheduled_date), day)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'média':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' 
        ? addDays(prev, 7)
        : addDays(prev, -7)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando agenda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agenda de Técnicos</h2>
          <p className="text-muted-foreground">
            Semana de {format(getWeekDays()[0], "dd/MM", { locale: ptBR })} à {format(getWeekDays()[6], "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um técnico" />
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

          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            ← Anterior
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Próxima →
          </Button>
        </div>
      </div>

      {/* Grade da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {getWeekDays().map((day, index) => {
          const dayItems = getItemsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={index} className={isToday ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {format(day, "EEEE", { locale: ptBR })}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(day, "dd/MM", { locale: ptBR })}
                  {isToday && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Hoje
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      Sem agendamentos
                    </p>
                  </div>
                ) : (
                  dayItems.map(item => (
                    <div key={item.id} className="p-2 border rounded-lg space-y-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-medium line-clamp-2">
                          {item.title}
                        </h4>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority[0].toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.scheduled_date), "HH:mm")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {item.client_name}
                        </span>
                      </div>

                      {selectedTechnician === "all" && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {item.technician_name}
                          </span>
                        </div>
                      )}

                      <Badge className={getStatusColor(item.status)} variant="secondary">
                        {item.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo da Semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{scheduleItems.length}</p>
              <p className="text-sm text-muted-foreground">Total de Ordens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {scheduleItems.filter(item => item.status === 'pendente').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {scheduleItems.filter(item => item.status === 'em_andamento').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {scheduleItems.filter(item => item.status === 'concluido').length}
              </p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}