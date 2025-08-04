import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeneralTabProps {
  form: UseFormReturn<any>;
}

export function GeneralTab({ form }: GeneralTabProps) {
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([]);
  const [questionnaires, setQuestionnaires] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadTechnicians();
    loadQuestionnaires();
  }, []);

  const loadTechnicians = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "tecnico")
      .eq("active", true);
    
    if (data) setTechnicians(data);
  };

  const loadQuestionnaires = async () => {
    // Por enquanto vazio - implementar quando houver tabela de questionários
    setQuestionnaires([]);
  };

  const taskTypes = [
    { id: "manutencao", name: "Manutenção" },
    { id: "instalacao", name: "Instalação" },
    { id: "reparo", name: "Reparo" },
    { id: "vistoria", name: "Vistoria" },
    { id: "limpeza", name: "Limpeza" },
    { id: "outros", name: "Outros" }
  ];

  const checkInTypes = [
    { id: "manual", name: "Padrão do colaborador" },
    { id: "automático", name: "Automático" },
    { id: "qr_code", name: "QR Code" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colaborador */}
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarefa será executada por *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Colaborador" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data */}
        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Não informar</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Horas */}
        <FormField
          control={form.control}
          name="scheduledTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="time"
                    {...field}
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de tarefa */}
        <FormField
          control={form.control}
          name="taskType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de tarefa *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tempo de duração */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de duração (minutos) *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="Ex: 120"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Questionário */}
        <FormField
          control={form.control}
          name="questionnaire"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Questionário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {questionnaires.map((questionnaire) => (
                    <SelectItem key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prioridade */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Alta" />
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
      </div>

      {/* Descrição da tarefa */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição da tarefa *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descreva a tarefa a ser executada..."
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo de check-in */}
        <FormField
          control={form.control}
          name="checkInType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de check-in</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Padrão do colaborador" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {checkInTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Palavra chave */}
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palavra chave</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Pesquisa de palavras-chave"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Código externo */}
        <FormField
          control={form.control}
          name="externalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código externo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Código externo"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Usar pesquisa de satisfação */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="useSatisfactionSurvey"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Usar pesquisa de satisfação</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {form.watch("useSatisfactionSurvey") && (
          <FormField
            control={form.control}
            name="surveyRecipientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email do destinatário da pesquisa</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}