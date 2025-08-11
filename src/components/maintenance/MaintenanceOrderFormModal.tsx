import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const maintenanceOrderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["preventiva", "preditiva", "corretiva", "detectiva", "tempo"]),
  priority: z.enum(["baixa", "média", "alta", "crítica"]),
  equipment_id: z.string().min(1, "Equipamento é obrigatório"),
  technician_id: z.string().optional(),
  scheduled_date: z.string().optional(),
  failure_code: z.string().optional(),
  root_cause: z.string().optional(),
});

type MaintenanceOrderFormData = z.infer<typeof maintenanceOrderSchema>;

interface MaintenanceOrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MaintenanceOrderFormModal = ({
  open,
  onOpenChange,
  onSuccess,
}: MaintenanceOrderFormModalProps) => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MaintenanceOrderFormData>({
    resolver: zodResolver(maintenanceOrderSchema),
    defaultValues: {
      type: "preventiva",
      priority: "média",
    },
  });

  useEffect(() => {
    if (open) {
      loadEquipments();
      loadTechnicians();
    }
  }, [open]);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from("equipments")
        .select("id, name")
        .eq("status", "ativo")
        .order("name");

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .in("role", ["tecnico", "supervisor"])
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error("Erro ao carregar técnicos:", error);
    }
  };

  const onSubmit = async (data: MaintenanceOrderFormData) => {
    try {
      setLoading(true);

      // Get current user and company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const orderData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        equipment_id: data.equipment_id,
        technician_id: data.technician_id || null,
        scheduled_date: data.scheduled_date ? new Date(data.scheduled_date).toISOString() : null,
        failure_code: data.failure_code || null,
        root_cause: data.root_cause || null,
        company_id: profile.company_id,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("maintenance_orders")
        .insert([orderData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ordem de manutenção criada com sucesso",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao criar ordem:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ordem de manutenção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Manutenção</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Manutenção preventiva do motor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Manutenção</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="preventiva">Preventiva</SelectItem>
                        <SelectItem value="preditiva">Preditiva</SelectItem>
                        <SelectItem value="corretiva">Corretiva</SelectItem>
                        <SelectItem value="detectiva">Detectiva</SelectItem>
                        <SelectItem value="tempo">Baseada no Tempo</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {equipments.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technician_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o técnico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>
                            {technician.name}
                          </SelectItem>
                        ))}
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
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes da manutenção..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(selectedType === "corretiva" || selectedType === "detectiva") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="failure_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código da Falha</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: E001, F202" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="root_cause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causa Raiz</FormLabel>
                      <FormControl>
                        <Input placeholder="Causa identificada da falha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Ordem"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};