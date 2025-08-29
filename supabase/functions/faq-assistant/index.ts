import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { question, topK = 3 } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    console.log('Processing question:', question);

    let response = '';
    let source = 'ai';
    
    // Use AI directly for now to test
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI key available:', !!openaiKey);
    
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          answer: 'Olá! Sou o assistente do sistema ORDI. Como posso ajudá-lo hoje? (Nota: IA temporariamente indisponível)',
          source: 'fallback',
          similarity_score: null,
          related_faqs: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log('Calling OpenAI API...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente útil que responde perguntas sobre o sistema ORDI - Sistema de Gestão de Ordens de Serviço e Manutenção.

O Sistema ORDI possui os seguintes módulos principais:
- Dashboard: Visão geral do sistema
- Chamados: Abertura e gestão de chamados de suporte
- Ordens de Serviço: Criação e acompanhamento de ordens de serviço
- Equipamentos: Cadastro e gestão de equipamentos
- Manutenção: Planejamento e execução de manutenções
- Usuários: Gestão de usuários e permissões
- Empresas: Cadastro de empresas e clientes
- Relatórios: Análises e relatórios do sistema

Responda de forma clara, objetiva e profissional em português. Se não souber a resposta específica sobre o sistema ORDI, seja honesto e sugira que o usuário consulte a documentação ou entre em contato com o suporte.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiData = await aiResponse.json();
    console.log('OpenAI response received successfully');
    
    response = aiData.choices[0].message.content;

    // Try to log activity (non-blocking)
    try {
      await supabase.rpc('log_client_event', {
        p_action: 'faq_query',
        p_details: {
          question: question.substring(0, 100),
          response_source: source,
          has_openai_key: !!openaiKey
        }
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        answer: response,
        source,
        similarity_score: null,
        related_faqs: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in FAQ assistant:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        answer: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        source: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});