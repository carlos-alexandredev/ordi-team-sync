import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Brain, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsResponse {
  answer: string;
  data: any;
  query_info: {
    table: string;
    original_question: string;
  };
}

interface QueryHistory {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

export const AIAnalytics = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-analytics', {
        body: { question: question.trim() }
      });

      if (error) {
        console.error('Error calling ai-analytics:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar consulta",
          variant: "destructive",
        });
        return;
      }

      const response: AnalyticsResponse = data;
      
      if (response.answer) {
        const newQuery: QueryHistory = {
          id: Date.now().toString(),
          question: question.trim(),
          answer: response.answer,
          timestamp: new Date()
        };

        setHistory(prev => [newQuery, ...prev]);
        setQuestion('');
        
        toast({
          title: "Consulta processada",
          description: "Resposta gerada com sucesso",
        });
      }
    } catch (error) {
      console.error('Error in AI analytics:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Quantas ordens de serviço foram criadas este mês?",
    "Quais usuários criaram mais chamados?",
    "Quantos equipamentos estão ativos?",
    "Qual é o status das ordens em andamento?",
    "Quantos usuários estão cadastrados no sistema?"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analytics com IA
          </CardTitle>
          <CardDescription>
            Faça perguntas sobre seus dados em linguagem natural
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Quantas ordens foram criadas este mês?"
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !question.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Sugestões:</span>
              {suggestedQuestions.map((suggested, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(suggested)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {suggested}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="mb-2">
                      <p className="font-medium text-primary">
                        {item.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};