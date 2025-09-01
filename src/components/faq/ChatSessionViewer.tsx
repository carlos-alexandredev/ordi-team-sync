import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bot, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatQuery {
  id: string;
  question: string;
  response: string | null;
  response_source: string;
  similarity_score: number | null;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  archived_at: string | null;
  user_name?: string;
  user_email?: string;
  profiles?: any;
}

interface ChatSessionViewerProps {
  sessionId: string;
  onBack: () => void;
}

export const ChatSessionViewer = ({ sessionId, onBack }: ChatSessionViewerProps) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [queries, setQueries] = useState<ChatQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);

      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('faq_sessions')
        .select(`
          id,
          title,
          created_at,
          last_activity,
          is_active,
          archived_at,
          profiles!faq_sessions_user_id_fkey(name, email)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      setSession({
        ...sessionData,
        user_name: sessionData.profiles?.name || null,
        user_email: sessionData.profiles?.email || null
      });

      // Load queries for this session
      const { data: queriesData, error: queriesError } = await supabase
        .from('faq_queries')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (queriesError) throw queriesError;

      setQueries(queriesData || []);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'database':
        return <Badge variant="default" className="text-xs">Base de Conhecimento</Badge>;
      case 'ai':
        return <Badge variant="secondary" className="text-xs">IA</Badge>;
      case 'fallback':
        return <Badge variant="outline" className="text-xs">Fallback</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{source}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando conversa...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sessão não encontrada</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para histórico
          </Button>
          {session.is_active ? (
            <Badge variant="secondary">Ativa</Badge>
          ) : (
            <Badge variant="outline">Arquivada</Badge>
          )}
        </div>
        <CardTitle className="text-lg">
          {session.title || 'Conversa sem título'}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(session.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
          </div>
          {session.user_name && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {session.user_name}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Última atividade: {format(new Date(session.last_activity), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-6">
            {queries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma pergunta encontrada nesta sessão</p>
              </div>
            ) : (
              queries.map((query) => (
                <div key={query.id} className="space-y-4">
                  {/* User Question */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm">{query.question}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(query.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  {query.response && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{query.response}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSourceBadge(query.response_source)}
                          {query.similarity_score && (
                            <Badge variant="outline" className="text-xs">
                              Similaridade: {(query.similarity_score * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};