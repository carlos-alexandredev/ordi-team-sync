import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthLogger = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          try {
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

            // Chamar edge function para logging
            await supabase.functions.invoke('auth-logger', {
              body: logData
            });
          } catch (error) {
            console.error('Erro ao registrar log de autenticação:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};