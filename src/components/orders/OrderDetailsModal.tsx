import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, User, Building, Calendar, Clock, Hash, FileText, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

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

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderEquipment {
  id: string;
  equipment_id: string;
  action_type: string;
  observations: string | null;
  equipment: {
    friendly_id: number;
    name: string;
    model: string | null;
    serial_number: string | null;
    location: string | null;
  };
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  const [linkedEquipments, setLinkedEquipments] = useState<OrderEquipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

  useEffect(() => {
    if (order && open) {
      loadLinkedEquipments();
    }
  }, [order, open]);

  const loadLinkedEquipments = async () => {
    if (!order) return;
    
    setLoadingEquipments(true);
    try {
      const { data, error } = await supabase
        .from('order_equipments')
        .select(`
          id,
          equipment_id,
          action_type,
          observations,
          equipment:equipments(
            friendly_id,
            name,
            model,
            serial_number,
            location
          )
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      setLinkedEquipments((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos da ordem:', error);
    } finally {
      setLoadingEquipments(false);
    }
  };

  if (!order) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Detalhes da Ordem #{String(order.friendly_id).padStart(4, '0')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {order.title}
                </CardTitle>
                {order.call && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Originada do chamado: {order.call.title}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getPriorityColor(order.priority)}>
                    Prioridade: {order.priority}
                  </Badge>
                  <Badge variant={getStatusColor(order.status)}>
                    Status: {order.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Cliente:</strong> {order.client_profile?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Empresa:</strong> {order.company?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Técnico:</strong> {order.technician_profile?.name || "Não atribuído"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Criado:</strong> {new Date(order.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {order.scheduled_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Agendado:</strong> {new Date(order.scheduled_date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                  {order.execution_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Executado:</strong> {new Date(order.execution_date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {order.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Linked Equipment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Equipamentos Vinculados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEquipments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Carregando equipamentos...</p>
                  </div>
                ) : linkedEquipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhum equipamento vinculado a esta ordem.</p>
                ) : (
                  <div className="space-y-3">
                    {linkedEquipments.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                #{String(item.equipment.friendly_id).padStart(6, '0')}
                              </span>
                              <span className="font-medium">{item.equipment.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.equipment.model && (
                                <span>Modelo: {item.equipment.model} • </span>
                              )}
                              {item.equipment.serial_number && (
                                <span>Série: {item.equipment.serial_number} • </span>
                              )}
                              {item.equipment.location && (
                                <span>Local: {item.equipment.location}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {item.action_type}
                          </Badge>
                        </div>
                        {item.observations && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Observações:</strong> {item.observations}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}