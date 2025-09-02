
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentSelector } from "./EquipmentSelector";
import { TimeTracker } from "./TimeTracker";
import { ServiceQuestionnaire } from "@/components/questionnaires/ServiceQuestionnaire";

const orderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["baixa", "média", "alta", "crítica"]),
  status: z.enum(["pendente", "em execução", "concluída", "cancelada"]),
  client_id: z.string().min(1, "Cliente é obrigatório"),
  technician_id: z.string().optional(),
  scheduled_date: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Order {
  id: string;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta" | "crítica";
  status: "pendente" | "em execução" | "concluída" | "cancelada";
  client_id: string;
  technician_id?: string;
  scheduled_date?: string;
}

interface SelectedEquipment {
  equipment_id: string;
  action_type: string;
  observations: string;
  equipment?: any;
}

interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  order?: Order;
  preselectedEquipmentId?: string;
  initialClientId?: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

export function OrderFormModal({ open, onOpenChange, onSuccess, order, preselectedEquipmentId, initialClientId }: OrderFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Profile[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<SelectedEquipment[]>([]);
  const { toast } = useToast();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "média",
      status: "pendente",
      client_id: "",
      technician_id: "",
      scheduled_date: "",
    },
  });

  const selectedClientId = form.watch("client_id");

  // Reset form when order prop changes
  useEffect(() => {
    if (order) {
      form.reset({
        title: order.title,
        description: order.description,
        priority: order.priority,
        status: order.status,
        client_id: order.client_id,
        technician_id: order.technician_id || "",
        scheduled_date: order.scheduled_date ? order.scheduled_date.split('T')[0] : "",
      });
      loadOrderEquipments(order.id);
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "média",
        status: "pendente",
        client_id: initialClientId || "",
        technician_id: "",
        scheduled_date: "",
      });
      setSelectedEquipments([]);

      // Handle preselected equipment
      if (preselectedEquipmentId && open) {
        const loadPreselectedEquipment = async () => {
          const { data: equipment } = await supabase
            .from("equipments")
            .select("id, name, client_id, company_id")
            .eq("id", preselectedEquipmentId)
            .single();

          if (equipment) {
            setSelectedEquipments([{
              equipment_id: equipment.id,
              action_type: "manutenção",
              observations: ""
            }]);
          }
        };
        loadPreselectedEquipment();
      }
    }
  }, [order, form, initialClientId, preselectedEquipmentId, open]);

  // Clear selected equipment when client changes
  useEffect(() => {
    if (!order && selectedClientId) {
      setSelectedEquipments([]);
    }
  }, [selectedClientId, order]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        // Carregar clientes
        const { data: clientsData } = await supabase
          .from("profiles")
          .select("id, name, role")
          .eq("role", "cliente_final")
          .eq("active", true);

        // Carregar técnicos (admin_cliente e admin por enquanto)
        const { data: techniciansData } = await supabase
          .from("profiles")
          .select("id, name, role")
          .in("role", ["admin_cliente", "admin"])
          .eq("active", true);

        setClients(clientsData || []);
        setTechnicians(techniciansData || []);
      } catch (error) {
        console.error("Erro ao carregar perfis:", error);
      }
    };

    if (open) {
      loadProfiles();
    }
  }, [open]);

  const loadOrderEquipments = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_equipments")
        .select(`
          equipment_id,
          action_type,
          observations,
          equipments (
            id,
            name,
            model,
            serial_number,
            location,
            status
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;

      const equipments = data?.map(item => ({
        equipment_id: item.equipment_id,
        action_type: item.action_type,
        observations: item.observations || "",
        equipment: item.equipments
      })) || [];

      setSelectedEquipments(equipments);
    } catch (error) {
      console.error("Erro ao carregar equipamentos da ordem:", error);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Buscar empresa do cliente selecionado
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", data.client_id)
        .single();

      if (!clientProfile?.company_id) {
        toast({
          title: "Erro",
          description: "Cliente deve estar vinculado a uma empresa",
          variant: "destructive",
        });
        return;
      }

      const orderData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        client_id: data.client_id,
        company_id: clientProfile.company_id,
        technician_id: data.technician_id || null,
        scheduled_date: data.scheduled_date ? new Date(data.scheduled_date).toISOString() : null,
      };

      let error, orderResult;
      const wasAssigned = order?.technician_id;
      const isBeingAssigned = data.technician_id && data.technician_id !== order?.technician_id;
      const isCompleted = data.status === 'concluída' && order?.status !== 'concluída';
      
      if (order) {
        // Atualizar ordem existente
        ({ data: orderResult, error } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", order.id)
          .select()
          .single());
      } else {
        // Criar nova ordem
        ({ data: orderResult, error } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single());
      }

      if (error) {
        console.error("Erro ao salvar ordem:", error);
        toast({
          title: "Erro",
          description: "Erro ao salvar ordem de serviço",
          variant: "destructive",
        });
        return;
      }

      // Gerenciar equipamentos selecionados
      if (!order && selectedEquipments.length > 0) {
        // Nova ordem - inserir equipamentos
        const equipmentInserts = selectedEquipments.map(equipment => ({
          order_id: orderResult.id,
          equipment_id: equipment.equipment_id,
          action_type: equipment.action_type,
          observations: equipment.observations,
        }));

        const { error: equipmentError } = await supabase
          .from("order_equipments")
          .insert(equipmentInserts);

        if (equipmentError) {
          console.error("Erro ao vincular equipamentos:", equipmentError);
        }
      }

      // Enviar notificações por e-mail
      try {
        if (!order) {
          // Nova ordem criada
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'order_created',
              recordId: orderResult.id
            }
          });
        } else if (isBeingAssigned) {
          // Ordem foi atribuída a um técnico
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'order_assigned',
              recordId: orderResult.id
            }
          });
        } else if (isCompleted) {
          // Ordem foi concluída
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'order_completed',
              recordId: orderResult.id
            }
          });
        }
        console.log("Email notification sent for order:", orderResult.id);
      } catch (emailError) {
        console.warn("Failed to send email notification:", emailError);
        // Não bloquear o fluxo se o e-mail falhar
      }

      toast({
        title: "Sucesso",
        description: order ? "Ordem atualizada com sucesso" : "Ordem criada com sucesso",
      });

      form.reset();
      setSelectedEquipments([]);
      onSuccess();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar ordem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título da ordem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.filter(client => client.id && client.id.trim() !== '').map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o serviço a ser executado"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="média">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em execução">Em execução</SelectItem>
                        <SelectItem value="concluída">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Agendada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technician_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico Responsável</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "unassigned" ? undefined : value)} 
                    value={field.value || "unassigned"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                     <SelectContent>
                       <SelectItem value="unassigned">Não atribuído</SelectItem>
                       {technicians.filter(technician => technician.id && technician.id.trim() !== '').map((technician) => (
                         <SelectItem key={technician.id} value={technician.id}>
                           {technician.name} ({technician.role})
                         </SelectItem>
                       ))}
                     </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EquipmentSelector 
              orderId={order?.id}
              clientId={selectedClientId}
              selectedEquipments={selectedEquipments}
              onSelectionChange={setSelectedEquipments}
              isReadOnly={!!order}
            />

            {order && (
              <div className="space-y-4">
                {order.technician_id && (
                  <TimeTracker 
                    orderId={order.id} 
                    technicianId={order.technician_id}
                    isReadOnly={form.watch('status') === 'concluída'}
                  />
                )}
                {order.status === 'concluída' && order.technician_id && (
                  <ServiceQuestionnaire 
                    orderId={order.id}
                    onComplete={() => {}}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : order ? "Atualizar" : "Criar Ordem"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
