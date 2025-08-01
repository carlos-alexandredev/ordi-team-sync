import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Wrench, CheckCircle, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TimeTracker } from "@/components/orders/TimeTracker";

interface TechnicianOrder {
  id: string;
  title: string;
  status: string;
  priority: string;
  scheduled_date: string;
  client_name: string;
  client_address: string;
  equipments: string[];
  total_time: number;
  is_active: boolean;
}

export const TechnicianDashboard = () => {
  const [orders, setOrders] = useState<TechnicianOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTechnicianOrders();
  }, []);

  const loadTechnicianOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil do usuário para pegar o ID do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar ordens do técnico
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          title,
          status,
          priority,
          scheduled_date,
          profiles!orders_client_id_fkey(name)
        `)
        .eq('technician_id', profile.id)
        .in('status', ['em execução', 'pendente'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const formattedOrders = ordersData?.map(order => ({
        id: order.id,
        title: order.title,
        status: order.status,
        priority: order.priority,
        scheduled_date: order.scheduled_date,
        client_name: order.profiles?.name || 'Cliente não informado',
        client_address: 'Endereço não informado',
        equipments: [],
        total_time: 0,
        is_active: false
      })) || [];

      setOrders(formattedOrders);
      
      // Verificar se há ordem ativa
      const active = formattedOrders.find(order => order.is_active);
      if (active) {
        setActiveOrder(active.id);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar suas ordens de serviço",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'em execução' })
        .eq('id', orderId);

      if (error) throw error;

      setActiveOrder(orderId);
      loadTechnicianOrders();
      
      toast({
        title: "Ordem iniciada",
        description: "Ordem de serviço iniciada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao iniciar ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar ordem de serviço",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'concluída': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'média': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Minhas Ordens de Serviço</h1>
      </div>

      {activeOrder && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Ordem Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeTracker 
              orderId={activeOrder} 
              technicianId={orders.find(o => o.id === activeOrder)?.id || ''} 
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className={`transition-all duration-200 hover:shadow-lg ${order.is_active ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {order.title}
                    {order.is_active && <Play className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {order.scheduled_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(order.scheduled_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground">{order.client_address}</p>
                  </div>
                </div>

                {order.equipments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Equipamentos:</p>
                    <div className="flex flex-wrap gap-1">
                      {order.equipments.map((equipment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    Tempo total: {Math.round(order.total_time / 60)}h {order.total_time % 60}min
                  </div>
                  
                  {order.status === 'agendada' && !activeOrder && (
                    <Button 
                      onClick={() => startOrder(order.id)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar
                    </Button>
                  )}
                  
                  {order.is_active && (
                    <Badge className="bg-primary text-primary-foreground">
                      Em execução
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};