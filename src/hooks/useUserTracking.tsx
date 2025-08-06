import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface UserSession {
  id: string;
  sessionId: string;
  userId: string;
  loginTime: string;
  lastActivity: string;
  lastPage?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export function useUserTracking() {
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Gerar um ID único de sessão
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Obter IP do usuário (usando um serviço externo)
  const getUserIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to get user IP:', error);
      return null;
    }
  };

  // Inicializar sessão do usuário
  const initializeSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && !sessionId) {
      const newSessionId = generateSessionId();
      const userIP = await getUserIP();
      
      try {
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            session_id: newSessionId,
            ip_address: userIP,
            user_agent: navigator.userAgent,
            last_page: location.pathname
          });

        if (!error) {
          setSessionId(newSessionId);
          localStorage.setItem('user-session-id', newSessionId);
        }
      } catch (error) {
        console.error('Error creating user session:', error);
      }
    }
  };

  // Atualizar atividade do usuário
  const updateActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentSessionId = sessionId || localStorage.getItem('user-session-id');
    
    if (user && currentSessionId) {
      try {
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            last_page: location.pathname
          })
          .eq('session_id', currentSessionId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating user activity:', error);
      }
    }
  };

  // Finalizar sessão
  const endSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentSessionId = sessionId || localStorage.getItem('user-session-id');
    
    if (user && currentSessionId) {
      try {
        await supabase
          .from('user_sessions')
          .update({
            is_active: false,
            logout_time: new Date().toISOString()
          })
          .eq('session_id', currentSessionId)
          .eq('user_id', user.id);
        
        localStorage.removeItem('user-session-id');
        setSessionId(null);
      } catch (error) {
        console.error('Error ending user session:', error);
      }
    }
  };

  // Inicializar ao montar o componente
  useEffect(() => {
    const savedSessionId = localStorage.getItem('user-session-id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
    initializeSession();

    // Cleanup ao desmontar
    return () => {
      // Atualizar uma última vez antes de sair
      updateActivity();
    };
  }, []);

  // Atualizar quando mudar de página
  useEffect(() => {
    updateActivity();
  }, [location.pathname, sessionId]);

  // Atualizar atividade periodicamente
  useEffect(() => {
    const interval = setInterval(updateActivity, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [sessionId]);

  // Listener para quando o usuário sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId]);

  return {
    sessionId,
    endSession,
    updateActivity
  };
}