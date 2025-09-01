import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  question: string;
}

interface QueryStructure {
  table: string;
  query_type: string;
  filters?: Record<string, any>;
  user_context?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    });

    const { question }: AnalyticsRequest = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Pergunta é obrigatória' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use OpenAI to interpret the question and generate query structure
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `Você é um assistente que converte perguntas em português para estruturas de consulta de banco de dados.

Tabelas disponíveis:
- orders (ordens de serviço): id, title, description, status, priority, client_id, technician_id, company_id, created_at, updated_at
- calls (chamados): id, title, description, status, priority, client_id, company_id, created_at, updated_at  
- equipments (equipamentos): id, name, model, serial_number, status, location, client_id, company_id, created_at, updated_at
- profiles (usuários): id, name, email, role, company_id, created_at, updated_at
- system_logs (logs): id, action, table_name, user_id, created_at
- faq_queries (consultas FAQ): id, question, response, user_id, company_id, created_at

Responda APENAS com um JSON válido no formato:
{
  "table": "nome_da_tabela",
  "query_type": "count|list|aggregate",
  "filters": {},
  "user_context": "filtros por usuário se necessário"
}

Se a pergunta não puder ser respondida com as tabelas disponíveis, retorne:
{
  "error": "Não é possível responder essa pergunta com os dados disponíveis"
}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
        temperature: 0.1
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pergunta com IA' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiResult = await openAIResponse.json();
    const aiAnswer = aiResult.choices[0].message.content;

    let queryStructure: QueryStructure;
    try {
      queryStructure = JSON.parse(aiAnswer);
    } catch (e) {
      console.error('Error parsing AI response:', aiAnswer);
      return new Response(
        JSON.stringify({ error: 'Erro ao interpretar resposta da IA' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (queryStructure.error) {
      return new Response(
        JSON.stringify({ error: queryStructure.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Execute the secure query using our enhanced database function
    const { data, error } = await supabaseClient.rpc('get_analytics_data', {
      p_table_name: queryStructure.table,
      p_query_type: queryStructure.query_type || 'count',
      p_filters: queryStructure.filters || {},
      p_aggregations: {},
      p_date_range: {}
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao executar consulta no banco de dados' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format the response in natural language
    const formatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente que formata resultados de consultas de banco em respostas naturais em português. Seja conciso e claro.' 
          },
          { 
            role: 'user', 
            content: `Pergunta original: ${question}\n\nResultado da consulta: ${JSON.stringify(data)}\n\nFormate uma resposta natural e amigável.` 
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
    });

    const formatResult = await formatResponse.json();
    const naturalResponse = formatResult.choices[0].message.content;

    // Log the interaction to faq_queries for history
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabaseClient
          .from('faq_queries')
          .insert({
            question: question,
            response: naturalResponse,
            response_source: 'ai_analytics',
            user_id: profile.id,
            company_id: profile.company_id,
            session_id: null // Will be linked by AIChat component
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        answer: naturalResponse,
        data: data,
        source: 'ai_analytics',
        query_info: {
          table: queryStructure.table,
          query_type: queryStructure.query_type,
          original_question: question
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});