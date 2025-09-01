import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Calendar, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChatSessionViewer } from "./ChatSessionViewer";

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  archived_at: string | null;
  user_name?: string;
  user_email?: string;
  query_count?: number;
  profiles?: any;
}

export const ChatHistoryGrouped = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role to determine what sessions to show
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      let query = supabase
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
        .order('last_activity', { ascending: false });

      // Filter based on user role
      if (profile.role === 'admin_master') {
        // Admin master can see all sessions
      } else if (['admin', 'admin_cliente'].includes(profile.role)) {
        // Company admins see sessions from their company
        query = query.eq('company_id', profile.company_id);
      } else {
        // Regular users see only their own sessions
        query = query.eq('user_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id);
      }

      const { data: sessionsData, error } = await query;

      if (error) throw error;

      // Count queries per session
      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { count } = await supabase
            .from('faq_queries')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            user_name: session.profiles?.name || null,
            user_email: session.profiles?.email || null,
            query_count: count || 0
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, []);

  const getSessionBadge = (session: ChatSession) => {
    if (session.is_active) {
      return <Badge variant="secondary" className="text-xs">Ativa</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Arquivada</Badge>;
  };

  if (selectedSession) {
    return (
      <ChatSessionViewer 
        sessionId={selectedSession} 
        onBack={() => setSelectedSession(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando histórico...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma conversa encontrada
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            As conversas com a IA aparecerão aqui quando arquivadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Histórico de Conversas
        </CardTitle>
        <CardDescription>
          Suas conversas anteriores com a Ordi IA organizadas por sessão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSession(session.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">
                      {session.title || 'Conversa sem título'}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.last_activity), 'HH:mm', { locale: ptBR })}
                      </div>
                      {session.user_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {session.user_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getSessionBadge(session)}
                    <span className="text-xs text-muted-foreground">
                      {session.query_count} {session.query_count === 1 ? 'pergunta' : 'perguntas'}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSession(session.id);
                  }}
                >
                  Ver conversa completa →
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};