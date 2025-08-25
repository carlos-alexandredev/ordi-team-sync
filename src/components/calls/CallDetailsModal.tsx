import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, Building, Calendar, Clock, Hash, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Call {
  id: string;
  friendly_id: number;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta";
  status: "aberto" | "em análise" | "fechado";
  created_at: string;
  updated_at: string;
  client_profile: { name: string };
  company: { name: string };
}

interface CallDetailsModalProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CallEquipment {
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

export function CallDetailsModal({ call, open, onOpenChange }: CallDetailsModalProps) {
  const [linkedEquipments, setLinkedEquipments] = useState<CallEquipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

  useEffect(() => {
    if (call && open) {
      loadLinkedEquipments();
    }
  }, [call, open]);

  const loadLinkedEquipments = async () => {
    if (!call) return;
    
    setLoadingEquipments(true);
    try {
      const { data, error } = await supabase
        .from('call_equipments')
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
        .eq('call_id', call.id);

      if (error) throw error;
      setLinkedEquipments((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos do chamado:', error);
    } finally {
      setLoadingEquipments(false);
    }
  };

  if (!call) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "destructive";
      case "média": return "default";
      case "baixa": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "destructive";
      case "em análise": return "default";
      case "fechado": return "secondary";
      default: return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Chamado #{String(call.friendly_id).padStart(4, '0')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {call.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getPriorityColor(call.priority)}>
                    Prioridade: {call.priority}
                  </Badge>
                  <Badge variant={getStatusColor(call.status)}>
                    Status: {call.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Cliente:</strong> {call.client_profile?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Empresa:</strong> {call.company?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Criado:</strong> {new Date(call.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Atualizado:</strong> {new Date(call.updated_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
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
                    {call.description}
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
                  <p className="text-sm text-muted-foreground py-4">Nenhum equipamento vinculado a este chamado.</p>
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