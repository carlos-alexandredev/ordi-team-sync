import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RepetitionTabProps {
  form: UseFormReturn<any>;
}

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" }
];

export function RepetitionTab({ form }: RepetitionTabProps) {
  const isRecurring = form.watch("isRecurring");
  const frequency = form.watch("frequency");
  const endType = form.watch("endType");
  const weekDays = form.watch("weekDays") || [];

  const handleWeekDayToggle = (dayValue: number, checked: boolean) => {
    const currentDays = form.getValues("weekDays") || [];
    
    if (checked) {
      form.setValue("weekDays", [...currentDays, dayValue]);
    } else {
      form.setValue("weekDays", currentDays.filter((day: number) => day !== dayValue));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Repeat className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Configuração de Repetição</h3>
      </div>

      <FormField
        control={form.control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) {
                    // Limpar campos de repetição quando desabilitar
                    form.setValue("frequency", undefined);
                    form.setValue("weekDays", []);
                    form.setValue("endType", undefined);
                    form.setValue("endDate", undefined);
                    form.setValue("repeatCount", undefined);
                  }
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-base font-medium">
                Repetir tarefa
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Ative esta opção para criar uma tarefa recorrente
              </p>
            </div>
          </FormItem>
        )}
      />

      {isRecurring && (
        <div className="space-y-6 pl-6 border-l-2 border-primary/20">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {frequency === "weekly" && (
            <div className="space-y-3">
              <FormLabel>Dias da semana</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WEEKDAYS.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={weekDays.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleWeekDayToggle(day.value, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
              {weekDays.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Selecione pelo menos um dia da semana
                </p>
              )}
            </div>
          )}

          <FormField
            control={form.control}
            name="endType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Como a repetição deve terminar?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="date">Em uma data específica</SelectItem>
                    <SelectItem value="count">Após um número de repetições</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {endType === "date" && (
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de término</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data de término</span>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {endType === "count" && (
            <FormField
              control={form.control}
              name="repeatCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de repetições</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="Ex: 10" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Resumo da Repetição:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {frequency && (
                <p>• Frequência: {
                  frequency === "daily" ? "Diária" :
                  frequency === "weekly" ? "Semanal" :
                  frequency === "monthly" ? "Mensal" : ""
                }</p>
              )}
              {frequency === "weekly" && weekDays.length > 0 && (
                <p>• Dias: {weekDays.map(day => 
                  WEEKDAYS.find(d => d.value === day)?.label
                ).join(", ")}</p>
              )}
              {endType === "date" && form.getValues("endDate") && (
                <p>• Termina em: {format(form.getValues("endDate"), "dd/MM/yyyy")}</p>
              )}
              {endType === "count" && form.getValues("repeatCount") && (
                <p>• Total de repetições: {form.getValues("repeatCount")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isRecurring && (
        <div className="bg-muted/50 p-6 rounded-lg text-center">
          <Repeat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Esta será uma tarefa única, executada apenas uma vez.
          </p>
        </div>
      )}
    </div>
  );
}