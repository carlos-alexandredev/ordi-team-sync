import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicianLocation {
  id: string;
  name: string;
  current_order_id?: string;
  current_order_title?: string;
  location?: string;
  status: 'disponivel' | 'em_campo' | 'offline';
  last_update?: string;
}

interface Order {
  id: string;
  title: string;
  client_name: string;
  location?: string;
  status: string;
  priority: string;
  scheduled_date: string;
}

export function InteractiveMap() {
  const [technicians, setTechnicians] = useState<TechnicianLocation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianLocation | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      // Carregar técnicos com suas ordens atuais
      const { data: techData } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          department
        `)
        .eq("role", "tecnico")
        .eq("active", true);

      // Carregar ordens ativas
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          title,
          status,
          priority,
          scheduled_date,
          client:profiles!orders_client_id_fkey(name)
        `)
        .in("status", ["pendente", "em execução"]);

      const formattedTechnicians: TechnicianLocation[] = techData?.map(tech => ({
        id: tech.id,
        name: tech.name,
        status: 'disponivel' as const,
        location: tech.department || 'Base'
      })) || [];

      const formattedOrders: Order[] = ordersData?.map(order => ({
        id: order.id,
        title: order.title,
        client_name: order.client?.name || "N/A",
        status: order.status,
        priority: order.priority,
        scheduled_date: order.scheduled_date
      })) || [];

      setTechnicians(formattedTechnicians);
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erro ao carregar dados do mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-800';
      case 'em_campo':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando mapa...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa Simulado */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização de Técnicos e Ordens
              </CardTitle>
              <CardDescription>
                Visualização em tempo real das localizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg h-96 p-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                  {/* Simulação de mapa com pontos */}
                  <div className="relative h-full">
                    {/* Técnicos no mapa */}
                    {technicians.map((tech, index) => (
                      <Button
                        key={tech.id}
                        variant="ghost"
                        size="sm"
                        className={`absolute p-2 rounded-full ${
                          selectedTechnician?.id === tech.id
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                        style={{
                          left: `${20 + (index % 4) * 20}%`,
                          top: `${20 + Math.floor(index / 4) * 25}%`
                        }}
                        onClick={() => setSelectedTechnician(tech)}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(tech.status).replace('text-', 'bg-').split(' ')[0]}`} />
                          <span className="text-xs mt-1">{tech.name.split(' ')[0]}</span>
                        </div>
                      </Button>
                    ))}

                    {/* Ordens no mapa */}
                    {orders.slice(0, 6).map((order, index) => (
                      <Button
                        key={order.id}
                        variant="ghost"
                        size="sm"
                        className={`absolute p-2 ${
                          selectedOrder?.id === order.id
                            ? 'ring-2 ring-orange-500'
                            : ''
                        }`}
                        style={{
                          left: `${30 + (index % 3) * 25}%`,
                          top: `${40 + Math.floor(index / 3) * 20}%`
                        }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex flex-col items-center">
                          <Navigation className="h-4 w-4 text-orange-600" />
                          <span className="text-xs mt-1">OS</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Detalhes */}
        <div className="space-y-4">
          {/* Detalhes do Técnico Selecionado */}
          {selectedTechnician && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedTechnician.name}</p>
                  <Badge className={getStatusColor(selectedTechnician.status)}>
                    {selectedTechnician.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Localização:</p>
                  <p className="text-sm">{selectedTechnician.location || 'Base'}</p>
                </div>
                {selectedTechnician.current_order_title && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ordem Atual:</p>
                    <p className="text-sm">{selectedTechnician.current_order_title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detalhes da Ordem Selecionada */}
          {selectedOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Ordem de Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedOrder.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getPriorityColor(selectedOrder.priority)}>
                      {selectedOrder.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente:</p>
                  <p className="text-sm">{selectedOrder.client_name}</p>
                </div>
                {selectedOrder.scheduled_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Agendado para:</p>
                    <p className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedOrder.scheduled_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legenda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs">Em Campo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-xs">Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-3 w-3 text-orange-600" />
                <span className="text-xs">Ordem de Serviço</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}