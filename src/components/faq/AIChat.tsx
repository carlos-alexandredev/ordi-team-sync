import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIChatSession } from "@/hooks/useAIChatSession";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'database' | 'ai';
  similarity?: number;
}

interface AIChatProps {
  variant?: 'default' | 'modal';
}

export function AIChat({ variant = 'default' }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getSessionId } = useAIChatSession();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Get or create session for this conversation
      const sessionId = await getSessionId(currentQuestion);

      // Get current session to ensure proper authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      let assistantMessage: ChatMessage;

      // First try ai-analytics for database queries
      try {
        const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('ai-analytics', {
          body: { question: currentQuestion },
          headers: session?.access_token ? { 
            Authorization: `Bearer ${session.access_token}` 
          } : undefined
        });

        if (!analyticsError && analyticsData?.answer) {
          assistantMessage = {
            id: Date.now().toString() + '-assistant',
            type: 'assistant',
            content: analyticsData.answer,
            timestamp: new Date(),
            source: 'database',
          };

          // Update the query with session_id for proper history tracking
          if (sessionId) {
            await supabase
              .from('faq_queries')
              .update({ session_id: sessionId })
              .eq('question', currentQuestion)
              .eq('response_source', 'ai_analytics')
              .order('created_at', { ascending: false })
              .limit(1);
          }
        } else {
          // Fall back to FAQ assistant if analytics couldn't handle the query
          const { data: faqData, error: faqError } = await supabase.functions.invoke('faq-assistant', {
            body: { 
              question: currentQuestion,
              topK: 3,
              sessionId: sessionId
            },
            headers: session?.access_token ? { 
              Authorization: `Bearer ${session.access_token}` 
            } : undefined
          });

          if (faqError) throw faqError;

          assistantMessage = {
            id: Date.now().toString() + '-assistant',
            type: 'assistant',
            content: faqData.answer || 'Desculpe, não consegui processar sua pergunta.',
            timestamp: new Date(),
            source: faqData.source,
            similarity: faqData.similarity_score,
          };
        }
      } catch (analyticsError) {
        console.log('Analytics failed, falling back to FAQ:', analyticsError);
        
        // Fall back to FAQ assistant
        const { data: faqData, error: faqError } = await supabase.functions.invoke('faq-assistant', {
          body: { 
            question: currentQuestion,
            topK: 3,
            sessionId: sessionId
          },
          headers: session?.access_token ? { 
            Authorization: `Bearer ${session.access_token}` 
          } : undefined
        });

        if (faqError) throw faqError;

        assistantMessage = {
          id: Date.now().toString() + '-assistant',
          type: 'assistant',
          content: faqData.answer || 'Desculpe, não consegui processar sua pergunta.',
          timestamp: new Date(),
          source: faqData.source,
          similarity: faqData.similarity_score,
        };
      }

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling FAQ assistant:', error);
      
      let errorMessage = 'Desculpe, houve um erro ao processar sua pergunta. Tente novamente.';
      let toastMessage = 'Erro ao buscar resposta. Tente novamente.';
      
      // Handle specific error types
      if (error.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns segundos.';
        toastMessage = 'Serviço indisponível temporariamente.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Problema de conectividade. Verifique sua conexão e tente novamente.';
        toastMessage = 'Problema de conexão.';
      } else if (error.message?.includes('autenticação') || error.message?.includes('authentication')) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        toastMessage = 'Sessão expirada.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'A consulta está demorando mais que o esperado. Tente uma pergunta mais específica.';
        toastMessage = 'Tempo limite excedido.';
      }

      toast.error(toastMessage);
      
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={variant === 'modal' ? "h-full flex flex-col" : "h-[calc(100vh-12rem)] max-h-[700px] min-h-[500px] flex flex-col"}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Assistente ORDI IA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Faça perguntas sobre nossos produtos e serviços
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 min-h-0">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Olá! Como posso ajudá-lo hoje?</p>
                <p className="text-xs mt-1">Digite uma pergunta para começar</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.source && (
                      <div className="flex items-center gap-1 mt-2">
                        <Badge 
                          variant={message.source === 'database' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {message.source === 'database' ? 'Banco de Dados' : 
                           message.source === 'ai' ? 'IA' : 'Base de Conhecimento'}
                        </Badge>
                        {message.similarity && (
                          <span className="text-xs opacity-75">
                            {Math.round(message.similarity * 100)}% relevância
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </ScrollArea>
        </div>
        
        <div className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua pergunta..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}