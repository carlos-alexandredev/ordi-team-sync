import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userEmail, userId, ipAddress, userAgent } = await req.json();

    // Buscar informações do perfil do usuário
    let userProfile = null;
    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('user_id', userId)
        .maybeSingle();
      userProfile = data;
    }

    // Inserir log de autenticação
    const { error } = await supabase
      .from('system_logs')
      .insert({
        event_type: 'auth',
        action: action,
        user_id: userProfile?.id,
        user_email: userEmail || userProfile?.email,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: {
          timestamp: new Date().toISOString(),
          action_type: action
        }
      });

    if (error) {
      console.error('Erro ao inserir log:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função auth-logger:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});