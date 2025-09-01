import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'database' | 'ai';
  similarity?: number;
}

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the faq-assistant edge function
      const { data, error } = await supabase.functions.invoke('faq-assistant', {
        body: { 
          question: userMessage.content,
          topK: 3
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        content: data.answer || 'Desculpe, não consegui processar sua pergunta.',
        timestamp: new Date(),
        source: data.source,
        similarity: data.similarity_score,
      };

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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Assistente de FAQ
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Faça perguntas sobre nossos produtos e serviços
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
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
                          {message.source === 'database' ? 'Base de Conhecimento' : 'IA'}
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
        
        <Separator />
        
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
      </CardContent>
    </Card>
  );
}