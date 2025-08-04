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
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  weekDays: z.array(z.number()).default([]),
  endType: z.enum(["date", "count"]).optional(),
  endDate: z.date().optional(),
  repeatCount: z.number().optional(),
  
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
      // Calcular totais
      const productsTotal = data.products.reduce((sum, product) => sum + product.total, 0);
      const servicesTotal = data.services.reduce((sum, service) => sum + service.total, 0);
      const additionalCostsTotal = data.additionalCosts.reduce((sum, cost) => sum + cost.value, 0);
      const subtotal = productsTotal + servicesTotal + additionalCostsTotal;
      const finalTotal = subtotal - data.globalDiscount;

      // Inserir tarefa principal
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          assigned_to: data.assignedTo,
          scheduled_date: data.scheduledDate.toISOString(),
          task_type: data.taskType,
          duration_minutes: data.duration,
          questionnaire_id: data.questionnaire,
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
          end_type: data.endType,
          end_date: data.endDate?.toISOString(),
          repeat_count: data.repeatCount,
          products_total: productsTotal,
          services_total: servicesTotal,
          additional_costs_total: additionalCostsTotal,
          global_discount: data.globalDiscount,
          final_total: finalTotal
        })
        .select()
        .single();

      if (taskError) throw taskError;

      toast({
        title: "Tarefa criada com sucesso!",
        description: "A tarefa foi registrada no sistema."
      });

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro ao criar tarefa",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Tarefa / Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="location">Localização</TabsTrigger>
                <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
                <TabsTrigger value="repetition">Repetição</TabsTrigger>
                <TabsTrigger value="values">Valores</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
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
              </div>
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
                <Button type="button" onClick={() => {
                  form.handleSubmit(onSubmit)();
                  form.reset();
                }}>
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