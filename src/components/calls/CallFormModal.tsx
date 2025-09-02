
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
import { EquipmentSelector } from "@/components/orders/EquipmentSelector";

const callSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["baixa", "média", "alta"]),
});

type CallFormData = z.infer<typeof callSchema>;

interface SelectedEquipment {
  equipment_id: string;
  action_type: string;
  observations: string;
}

interface CallFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedEquipmentId?: string;
}

export const CallFormModal = ({ open, onOpenChange, onSuccess, preselectedEquipmentId }: CallFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<SelectedEquipment[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "média",
    },
  });

  useEffect(() => {
    if (open) {
      // Buscar o perfil do usuário para obter o clientId
      const loadUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();
          
          if (profile) {
            setClientId(profile.id);

            // Handle preselected equipment
            if (preselectedEquipmentId) {
              const { data: equipment } = await supabase
                .from("equipments")
                .select("id, name, client_id, company_id")
                .eq("id", preselectedEquipmentId)
                .single();

              if (equipment && equipment.company_id === profile.company_id) {
                setSelectedEquipments([{
                  equipment_id: equipment.id,
                  action_type: "manutenção",
                  observations: ""
                }]);
              }
            }
          }
        }
      };
      
      loadUserProfile();
    } else {
      // Reset form when modal closes
      form.reset();
      setSelectedEquipments([]);
    }
  }, [open, form, preselectedEquipmentId]);

  const onSubmit = async (data: CallFormData) => {
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

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile || !profile.company_id) {
        toast({
          title: "Erro",
          description: "Perfil de usuário não encontrado ou empresa não vinculada",
          variant: "destructive",
        });
        return;
      }

      const { data: callData, error } = await supabase
        .from("calls")
        .insert({
          title: data.title,
          description: data.description,
          priority: data.priority,
          client_id: profile.id,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar chamado:", error);
        toast({
          title: "Erro",
          description: "Erro ao criar chamado",
          variant: "destructive",
        });
        return;
      }

      // Inserir equipamentos selecionados
      if (selectedEquipments.length > 0) {
        const equipmentInserts = selectedEquipments.map(equipment => ({
          call_id: callData.id,
          equipment_id: equipment.equipment_id,
          action_type: equipment.action_type,
          observations: equipment.observations,
        }));

        const { error: equipmentError } = await supabase
          .from("call_equipments")
          .insert(equipmentInserts);

        if (equipmentError) {
          console.error("Erro ao vincular equipamentos:", equipmentError);
          // Não bloquear o fluxo se falhar ao vincular equipamentos
        }
      }

      // Enviar notificação por e-mail
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'call_created',
            recordId: callData.id
          }
        });
        console.log("Email notification sent for call:", callData.id);
      } catch (emailError) {
        console.warn("Failed to send email notification:", emailError);
        // Não bloquear o fluxo se o e-mail falhar
      }

      toast({
        title: "Sucesso",
        description: "Chamado criado com sucesso",
      });

      form.reset();
      setSelectedEquipments([]);
      onSuccess();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar chamado",
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
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do chamado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o problema ou solicitação"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EquipmentSelector
              clientId={clientId}
              selectedEquipments={selectedEquipments}
              onSelectionChange={setSelectedEquipments}
            />

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
                {loading ? "Criando..." : "Criar Chamado"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
