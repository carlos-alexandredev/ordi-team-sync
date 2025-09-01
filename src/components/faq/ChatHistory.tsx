import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Bot, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatQuery {
  id: string;
  question: string;
  response: string;
  response_source: string; // Changed from union type to string
  similarity_score: number | null;
  user_id: string;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export function ChatHistory() {
  const [queries, setQueries] = useState<ChatQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faq_queries')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setQueries(data || []);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = 
      query.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = selectedSource === "all" || query.response_source === selectedSource;
    
    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'database':
        return <Badge variant="default">Base de Conhecimento</Badge>;
      case 'ai':
        return <Badge variant="secondary">IA</Badge>;
      case 'fallback':
        return <Badge variant="outline">Fallback</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Histórico de Conversas - ORDI IA
          </CardTitle>
          <CardDescription>
            Acompanhe todas as interações dos usuários com nossa IA para melhorar continuamente o serviço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pergunta, resposta ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedSource === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSource("all")}
              >
                Todas
              </Button>
              <Button
                variant={selectedSource === "database" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSource("database")}
              >
                Base
              </Button>
              <Button
                variant={selectedSource === "ai" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSource("ai")}
              >
                IA
              </Button>
              <Button
                variant={selectedSource === "fallback" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSource("fallback")}
              >
                Fallback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {filteredQueries.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-xs mt-1">
                    {searchTerm ? "Tente ajustar sua busca" : "As conversas aparecerão aqui conforme os usuários interagem com a IA"}
                  </p>
                </div>
              ) : (
                filteredQueries.map((query) => (
                  <div key={query.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {query.profiles?.name || 'Usuário não identificado'}
                        </span>
                        <span>•</span>
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(query.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSourceBadge(query.response_source)}
                        {query.similarity_score && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(query.similarity_score * 100)}% relevância
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">Pergunta:</div>
                          <div className="text-sm bg-muted rounded-lg p-3">
                            {query.question}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">Resposta:</div>
                          <div className="text-sm bg-secondary/20 rounded-lg p-3 whitespace-pre-wrap">
                            {query.response}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}