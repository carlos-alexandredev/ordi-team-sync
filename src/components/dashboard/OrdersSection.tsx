
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Eye, Calendar, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";

interface Order {
  id: string;
  friendly_id: number;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta" | "crítica";
  status: "pendente" | "em execução" | "concluída" | "cancelada";
  scheduled_date: string | null;
  execution_date: string | null;
  created_at: string;
  updated_at: string;
  client_id: string;
  technician_id?: string;
  client_profile: { name: string };
  company: { name: string };
  technician_profile?: { name: string };
  call?: { title: string };
}

export const OrdersSection = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          friendly_id,
          title,
          description,
          priority,
          status,
          scheduled_date,
          execution_date,
          created_at,
          updated_at,
          client_id,
          technician_id,
          client_profile:profiles!orders_client_id_fkey(name),
          company:companies(name),
          technician_profile:profiles!orders_technician_id_fkey(name),
          call:calls(title)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "crítica": return "destructive";
      case "alta": return "destructive";
      case "média": return "default";
      case "baixa": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "secondary";
      case "em execução": return "default";
      case "concluída": return "secondary";
      case "cancelada": return "destructive";
      default: return "default";
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ordens de Serviço Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando ordens...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ordens de Serviço Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          #{String(order.friendly_id).padStart(4, '0')}
                        </span>
                        <Badge variant={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium truncate">{order.title}</h4>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.client_profile?.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {order.company?.name}
                        </div>
                        {order.scheduled_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.scheduled_date).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>
                      
                      {order.technician_profile && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Técnico: {order.technician_profile.name}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      className="ml-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <OrderDetailsModal
        order={selectedOrder}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
};
