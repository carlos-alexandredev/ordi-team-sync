import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthLogger = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Use setTimeout to defer the async operation and prevent deadlocks
          setTimeout(async () => {
            try {
              console.log('Auth event detected:', event, session?.user?.email);
              
              // Capturar informações do cliente
              const ipResponse = await fetch('https://api.ipify.org?format=json');
              const ipData = await ipResponse.json();
              
              const logData = {
                action: event === 'SIGNED_IN' ? 'login' : 'logout',
                userEmail: session?.user?.email,
                userId: session?.user?.id,
                ipAddress: ipData.ip,
                userAgent: navigator.userAgent
              };

              console.log('Enviando log de autenticação:', logData);

              // Chamar edge function para logging
              const { data, error } = await supabase.functions.invoke('auth-logger', {
                body: logData
              });

              if (error) {
                console.error('Erro na edge function auth-logger:', error);
              } else {
                console.log('Log de autenticação criado com sucesso:', data);
              }
            } catch (error) {
              console.error('Erro ao registrar log de autenticação:', error);
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};