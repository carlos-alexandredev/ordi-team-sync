import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Componentes das abas
import { GeneralTab } from "./tabs/GeneralTab";
import { LocationTab } from "./tabs/LocationTab";
import { EquipmentsTab } from "./tabs/EquipmentsTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { RepetitionTab } from "./tabs/RepetitionTab";
import { ValuesTab } from "./tabs/ValuesTab";

const taskSchema = z.object({
  // Aba Geral
  assignedTo: z.string().min(1, "Colaborador é obrigatório"),
  scheduledDate: z.date({ required_error: "Data é obrigatória" }),
  taskType: z.string().min(1, "Tipo de tarefa é obrigatório"),
  duration: z.number().min(1, "Duração deve ser maior que 0"),
  questionnaire: z.string().optional(),
  priority: z.enum(["baixa", "média", "alta"]).default("média"),
  description: z.string().min(1, "Descrição é obrigatória"),
  checkInType: z.enum(["manual", "automático", "qr_code"]).default("manual"),
  keyword: z.string().optional(),
  externalCode: z.string().optional(),
  useSatisfactionSurvey: z.boolean().default(false),
  surveyRecipientEmail: z.string().email().optional(),
  
  // Aba Localização
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  clientId: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  
  // Aba Equipamentos
  equipments: z.array(z.string()).default([]),
  
  // Aba Anexos
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).default([]),
  
  // Aba Repetição
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["diária", "semanal", "mensal"]).optional(),
  weekDays: z.array(z.number()).default([]),
  endDate: z.date().optional(),
  repeatCount: z.number().optional(),
  endType: z.enum(["data", "repeticoes"]).optional(),
  
  // Aba Valores
  products: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    discount: z.number().default(0),
    total: z.number()
  })).default([]),
  services: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    discount: z.number().default(0),
    total: z.number()
  })).default([]),
  additionalCosts: z.array(z.object({
    description: z.string(),
    value: z.number()
  })).default([]),
  globalDiscount: z.number().default(0)
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskFormModal({ open, onOpenChange, onSuccess }: TaskFormModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "média",
      checkInType: "manual",
      useSatisfactionSurvey: false,
      equipments: [],
      attachments: [],
      isRecurring: false,
      weekDays: [],
      products: [],
      services: [],
      additionalCosts: [],
      globalDiscount: 0
    }
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Obter usuário atual e empresa
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Calcular totais
      const productsTotal = data.products.reduce((sum, product) => sum + product.total, 0);
      const servicesTotal = data.services.reduce((sum, service) => sum + service.total, 0);
      const additionalCostsTotal = data.additionalCosts.reduce((sum, cost) => sum + cost.value, 0);
      const subtotal = productsTotal + servicesTotal + additionalCostsTotal;
      const finalTotal = subtotal - data.globalDiscount;

      // Criar tarefa principal
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          assigned_to: data.assignedTo,
          company_id: profile.company_id,
          scheduled_date: data.scheduledDate.toISOString(),
          task_type: data.taskType,
          duration_minutes: data.duration,
          questionnaire_id: data.questionnaire || null,
          priority: data.priority,
          description: data.description,
          check_in_type: data.checkInType,
          keyword: data.keyword,
          external_code: data.externalCode,
          use_satisfaction_survey: data.useSatisfactionSurvey,
          survey_recipient_email: data.surveyRecipientEmail,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          client_id: data.clientId,
          google_maps_url: data.googleMapsUrl,
          is_recurring: data.isRecurring,
          frequency: data.frequency,
          week_days: data.weekDays,
          end_date: data.endDate?.toISOString(),
          repeat_count: data.repeatCount,
          end_type: data.endType,
          products_total: productsTotal,
          services_total: servicesTotal,
          additional_costs_total: additionalCostsTotal,
          global_discount: data.globalDiscount,
          final_total: finalTotal
        })
        .select()
        .single();

      if (error) throw error;

      // Inserir produtos
      if (data.products.length > 0) {
        const { error: productsError } = await supabase
          .from("task_products")
          .insert(
            data.products.map(product => ({
              task_id: task.id,
              name: product.name,
              quantity: product.quantity,
              unit_price: product.unitPrice,
              discount: product.discount,
              total: product.total
            }))
          );

        if (productsError) throw productsError;
      }

      // Inserir serviços
      if (data.services.length > 0) {
        const { error: servicesError } = await supabase
          .from("task_services")
          .insert(
            data.services.map(service => ({
              task_id: task.id,
              name: service.name,
              quantity: service.quantity,
              unit_price: service.unitPrice,
              discount: service.discount,
              total: service.total
            }))
          );

        if (servicesError) throw servicesError;
      }

      // Inserir custos adicionais
      if (data.additionalCosts.length > 0) {
        const { error: costsError } = await supabase
          .from("task_additional_costs")
          .insert(
            data.additionalCosts.map(cost => ({
              task_id: task.id,
              description: cost.description,
              value: cost.value
            }))
          );

        if (costsError) throw costsError;
      }

      // Vincular equipamentos
      if (data.equipments.length > 0) {
        const { error: equipmentsError } = await supabase
          .from("task_equipments")
          .insert(
            data.equipments.map(equipmentId => ({
              task_id: task.id,
              equipment_id: equipmentId
            }))
          );

        if (equipmentsError) throw equipmentsError;
      }

      toast({
        title: "Sucesso!",
        description: "Tarefa criada com sucesso.",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const nextTab = () => {
    const tabs = ["general", "location", "equipments", "attachments", "repetition", "values"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = ["general", "location", "equipments", "attachments", "repetition", "values"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleSaveAndAddAnother = async (data: TaskFormData) => {
    await onSubmit(data);
    // Reset form but keep modal open
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa / Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="location">Localização</TabsTrigger>
                <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
                <TabsTrigger value="repetition">Repetição</TabsTrigger>
                <TabsTrigger value="values">Valores</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-6">
                <GeneralTab form={form} />
              </TabsContent>

              <TabsContent value="location" className="mt-6">
                <LocationTab form={form} />
              </TabsContent>

              <TabsContent value="equipments" className="mt-6">
                <EquipmentsTab form={form} />
              </TabsContent>

              <TabsContent value="attachments" className="mt-6">
                <AttachmentsTab form={form} />
              </TabsContent>

              <TabsContent value="repetition" className="mt-6">
                <RepetitionTab form={form} />
              </TabsContent>

              <TabsContent value="values" className="mt-6">
                <ValuesTab form={form} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={prevTab} disabled={activeTab === "general"}>
                  Anterior
                </Button>
                <Button type="button" variant="outline" onClick={nextTab} disabled={activeTab === "values"}>
                  Próximo
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button type="submit">
                  Salvar
                </Button>
                <Button 
                  type="button" 
                  variant="default"
                  onClick={form.handleSubmit(handleSaveAndAddAnother)}
                >
                  Salvar e Incluir Outra
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
