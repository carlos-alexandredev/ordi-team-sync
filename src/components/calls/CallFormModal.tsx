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

const callSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["baixa", "média", "alta"]),
});

type CallFormData = z.infer<typeof callSchema>;

interface CallFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CallFormModal({ open, onOpenChange, onSuccess }: CallFormModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "média",
    },
  });

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
      <DialogContent className="sm:max-w-[500px]">
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