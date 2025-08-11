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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const conditionReadingSchema = z.object({
  equipment_id: z.string().min(1, "Equipamento é obrigatório"),
  metric: z.string().min(1, "Métrica é obrigatória"),
  value: z.number().min(0, "Valor deve ser positivo"),
  unit: z.string().optional(),
  reading_at: z.string().optional(),
  source: z.enum(["manual", "sensor", "import"]).default("manual"),
});

type ConditionReadingFormData = z.infer<typeof conditionReadingSchema>;

interface ConditionReadingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ConditionReadingFormModal = ({
  open,
  onOpenChange,
  onSuccess,
}: ConditionReadingFormModalProps) => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ConditionReadingFormData>({
    resolver: zodResolver(conditionReadingSchema),
    defaultValues: {
      source: "manual",
      reading_at: new Date().toISOString().slice(0, 16),
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

  const onSubmit = async (data: ConditionReadingFormData) => {
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

      const readingData = {
        equipment_id: data.equipment_id,
        metric: data.metric,
        value: data.value,
        unit: data.unit || null,
        reading_at: data.reading_at ? new Date(data.reading_at).toISOString() : new Date().toISOString(),
        source: data.source,
        company_id: profile.company_id,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("condition_readings")
        .insert([readingData]);

      if (error) throw error;

      // Check if this reading triggers any predictive/detective maintenance plans
      await checkConditionTriggers(data.equipment_id, data.metric, data.value);

      toast({
        title: "Sucesso",
        description: "Leitura de condição registrada com sucesso",
      });

      form.reset({
        source: "manual",
        reading_at: new Date().toISOString().slice(0, 16),
      });
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao registrar leitura:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar leitura de condição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConditionTriggers = async (equipmentId: string, metric: string, value: number) => {
    try {
      // Check if there are any maintenance plans that should be triggered
      const { data: plans, error } = await supabase
        .from("maintenance_plans")
        .select("*")
        .eq("equipment_id", equipmentId)
        .eq("condition_metric", metric)
        .eq("status", "ativo")
        .in("type", ["preditiva", "detectiva"]);

      if (error) throw error;

      for (const plan of plans || []) {
        if (plan.condition_threshold && value >= plan.condition_threshold) {
          // Create maintenance order automatically
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("user_id", user?.id)
            .single();

          await supabase.from("maintenance_orders").insert([{
            title: `${plan.type.toUpperCase()} - ${plan.title}`,
            description: `Ordem gerada automaticamente por condição: ${metric} = ${value} (limite: ${plan.condition_threshold})`,
            type: plan.type,
            equipment_id: equipmentId,
            plan_id: plan.id,
            company_id: profile?.company_id,
            priority: "alta",
            status: "aberta",
            created_by: user?.id,
          }]);

          toast({
            title: "Alerta de Condição",
            description: `Ordem de manutenção ${plan.type} criada automaticamente`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar gatilhos de condição:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova Leitura de Condição</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Métrica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: temperature, vibration.rms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: °C, mm/s, bar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Ex: 75.5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Fonte da leitura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="sensor">Sensor</SelectItem>
                        <SelectItem value="import">Importação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reading_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data/Hora da Leitura</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
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
                {loading ? "Registrando..." : "Registrar Leitura"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};