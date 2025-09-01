import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MessageSquare, Bot, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

interface FAQResult {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  similarity_score: number;
}

interface AIResponse {
  response: string;
  source: 'database' | 'ai' | 'error';
  similarity_score?: number;
  related_faqs?: FAQResult[];
}

export function FAQSearch() {
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const { toast } = useToast();
  
  const debouncedQuestion = useDebounce(question, 300);

  // Search FAQs in database
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["search-faqs", debouncedQuestion],
    queryFn: async () => {
      if (!debouncedQuestion.trim()) return [];
      
      const { data, error } = await supabase.rpc('search_faqs', {
        p_query: debouncedQuestion,
        p_limit: 3
      });
      
      if (error) {
        console.error('Error searching FAQs:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: debouncedQuestion.length > 2
  });

  const handleAskAI = async () => {
    if (!question.trim()) {
      toast({
        title: "Digite uma pergunta",
        description: "Por favor, digite uma pergunta antes de consultar a IA",
        variant: "destructive",
      });
      return;
    }

    setLoadingAI(true);
    setAiResponse(null);

    try {
      // Get current session to include Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('faq-assistant', {
        body: { question: question.trim() },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) {
        throw error;
      }

      setAiResponse(data);
    } catch (error: any) {
      console.error('Error calling FAQ assistant:', error);
      toast({
        title: "Erro ao consultar IA",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const clearResults = () => {
    setQuestion("");
    setAiResponse(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Central de Ajuda
          </CardTitle>
          <CardDescription>
            Faça uma pergunta e encontre respostas na nossa base de conhecimento ou consulte nossa IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite sua pergunta aqui..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleAskAI}
                disabled={loadingAI || !question.trim()}
                className="gap-2"
              >
                {loadingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                Perguntar à IA
              </Button>
            </div>

            {(question || aiResponse) && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Limpar resultados
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Results */}
      {faqs.length > 0 && !aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Respostas encontradas na base de conhecimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq: FAQResult, index) => (
              <div key={faq.id}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{faq.question}</h4>
                    <div className="flex gap-2">
                      {faq.category && (
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(faq.similarity_score * 100)}% relevância
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </div>
                {index < faqs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Response */}
      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Resposta da IA
              <Badge variant={aiResponse.source === 'database' ? 'default' : 'secondary'}>
                {aiResponse.source === 'database' ? 'Base de Conhecimento' : 'IA'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiResponse.response}
              </p>
              
              {aiResponse.related_faqs && aiResponse.related_faqs.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Perguntas relacionadas:</h5>
                  <div className="space-y-1">
                    {aiResponse.related_faqs.map((faq, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {faq.question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {(loadingFaqs || loadingAI) && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingFaqs ? "Buscando na base de conhecimento..." : "Consultando IA..."}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {debouncedQuestion.length > 2 && faqs.length === 0 && !loadingFaqs && !aiResponse && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Nenhuma resposta encontrada na base de conhecimento
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Perguntar à IA" para obter uma resposta personalizada
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}