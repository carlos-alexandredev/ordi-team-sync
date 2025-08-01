import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuestionnaireField {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating';
  label: string;
  required: boolean;
  options?: string[];
  value?: any;
}

interface ServiceQuestionnaireProps {
  orderId: string;
  onComplete?: () => void;
}

export const ServiceQuestionnaire = ({ orderId, onComplete }: ServiceQuestionnaireProps) => {
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeQuestionnaire();
    loadExistingResponses();
  }, [orderId]);

  const initializeQuestionnaire = () => {
    // Questionário padrão para ordens de serviço
    const defaultFields: QuestionnaireField[] = [
      {
        id: 'problema_resolvido',
        type: 'radio',
        label: 'O problema foi resolvido completamente?',
        required: true,
        options: ['Sim', 'Parcialmente', 'Não']
      },
      {
        id: 'tempo_execucao',
        type: 'select',
        label: 'Tempo real de execução',
        required: true,
        options: ['Menor que o previsto', 'Conforme previsto', 'Maior que o previsto']
      },
      {
        id: 'dificuldades',
        type: 'textarea',
        label: 'Dificuldades encontradas (se houver)',
        required: false
      },
      {
        id: 'pecas_utilizadas',
        type: 'textarea',
        label: 'Peças/materiais utilizados',
        required: false
      },
      {
        id: 'recomendacoes',
        type: 'textarea',
        label: 'Recomendações para manutenção preventiva',
        required: false
      },
      {
        id: 'satisfacao_cliente',
        type: 'rating',
        label: 'Satisfação do cliente (1-5)',
        required: true,
        options: ['1', '2', '3', '4', '5']
      },
      {
        id: 'proximas_acoes',
        type: 'checkbox',
        label: 'Próximas ações necessárias',
        required: false,
        options: ['Manutenção preventiva', 'Substituição de peças', 'Treinamento do cliente', 'Revisão em 30 dias']
      },
      {
        id: 'observacoes_gerais',
        type: 'textarea',
        label: 'Observações gerais',
        required: false
      }
    ];

    setFields(defaultFields);
  };

  const loadExistingResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('order_questionnaire_responses')
        .select('responses')
        .eq('order_id', orderId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.responses) {
        setResponses(data.responses);
        setCompleted(true);
      }
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !responses[field.id]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const saveQuestionnaire = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('order_questionnaire_responses')
        .upsert({
          order_id: orderId,
          responses: responses,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setCompleted(true);
      toast({
        title: "Questionário salvo",
        description: "Questionário preenchido com sucesso"
      });

      onComplete?.();
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar questionário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: QuestionnaireField) => {
    const value = responses[field.id];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={completed}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={completed}
            rows={3}
          />
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={completed}
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={completed}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'rating':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={completed}
            className="flex gap-4"
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleFieldChange(field.id, [...selectedValues, option]);
                    } else {
                      handleFieldChange(field.id, selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                  disabled={completed}
                />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {completed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
          Questionário de Execução
          {completed && (
            <span className="text-sm font-normal text-green-600 ml-2">
              (Concluído)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}

        {!completed && (
          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveQuestionnaire}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Questionário'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};