import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export const useAIChatSession = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Create a new chat session
  const createSession = async (firstQuestion?: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      // Create new session
      const { data: session, error } = await supabase
        .from('faq_sessions')
        .insert({
          user_id: profile.id,
          company_id: profile.company_id,
          title: firstQuestion ? firstQuestion.substring(0, 50) + (firstQuestion.length > 50 ? '...' : '') : 'Nova conversa'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(session);
      
      // Store in localStorage for persistence
      localStorage.setItem('aiChatSessionId', session.id);
      
      return session.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova sessão de chat",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing session from localStorage
  const loadSession = async (): Promise<string | null> => {
    try {
      const sessionId = localStorage.getItem('aiChatSessionId');
      if (!sessionId) return null;

      const { data: session, error } = await supabase
        .from('faq_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (error || !session) {
        localStorage.removeItem('aiChatSessionId');
        return null;
      }

      setCurrentSession(session);
      return session.id;
    } catch (error) {
      console.error('Error loading session:', error);
      localStorage.removeItem('aiChatSessionId');
      return null;
    }
  };

  // Archive current session (on logout)
  const archiveSession = async () => {
    try {
      const sessionId = localStorage.getItem('aiChatSessionId');
      if (!sessionId) return;

      await supabase
        .from('faq_sessions')
        .update({ 
          is_active: false, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      localStorage.removeItem('aiChatSessionId');
      setCurrentSession(null);
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  };

  // Get or create session for current user
  const getSessionId = async (firstQuestion?: string): Promise<string | null> => {
    // Try to load existing session first
    const existingSessionId = await loadSession();
    if (existingSessionId) return existingSessionId;

    // Create new session if none exists
    return await createSession(firstQuestion);
  };

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await archiveSession();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Try to load existing session when user signs in
        await loadSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load session on hook initialization
  useEffect(() => {
    loadSession();
  }, []);

  return {
    currentSession,
    isLoading,
    createSession,
    loadSession,
    archiveSession,
    getSessionId,
  };
};