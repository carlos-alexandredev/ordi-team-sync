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

const maintenancePlanSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["preventiva", "preditiva", "corretiva", "detectiva", "tempo"]),
  equipment_id: z.string().min(1, "Equipamento é obrigatório"),
  periodicity_days: z.number().optional(),
  usage_interval: z.number().optional(),
  condition_metric: z.string().optional(),
  condition_threshold: z.number().optional(),
  next_due_at: z.string().optional(),
});

type MaintenancePlanFormData = z.infer<typeof maintenancePlanSchema>;

interface MaintenancePlanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MaintenancePlanFormModal = ({
  open,
  onOpenChange,
  onSuccess,
}: MaintenancePlanFormModalProps) => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MaintenancePlanFormData>({
    resolver: zodResolver(maintenancePlanSchema),
    defaultValues: {
      type: "preventiva",
    },
  });

  useEffect(() => {
    if (open) {
      loadEquipments();
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

  const onSubmit = async (data: MaintenancePlanFormData) => {
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

      const planData = {
        title: data.title,
        description: data.description,
        type: data.type,
        equipment_id: data.equipment_id,
        company_id: profile.company_id,
        periodicity_days: data.periodicity_days || null,
        usage_interval: data.usage_interval || null,
        condition_metric: data.condition_metric || null,
        condition_threshold: data.condition_threshold || null,
        next_due_at: data.next_due_at ? new Date(data.next_due_at).toISOString() : null,
      };

      const { error } = await supabase
        .from("maintenance_plans")
        .insert([planData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de manutenção criado com sucesso",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao criar plano:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar plano de manutenção",
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
          <DialogTitle>Novo Plano de Manutenção</DialogTitle>
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
                      <Input placeholder="Ex: Manutenção preventiva mensal" {...field} />
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o plano de manutenção..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional fields based on maintenance type */}
            {(selectedType === "preventiva" || selectedType === "tempo") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodicity_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodicidade (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usage_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Uso (horas/ciclos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 100"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {(selectedType === "preditiva" || selectedType === "detectiva") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="condition_metric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Métrica de Condição</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: vibration.rms, temperature"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Condição</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Ex: 75.5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="next_due_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Data Programada</FormLabel>
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

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Plano"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};