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

    // First, search in FAQ database
    const { data: faqs, error: searchError } = await supabase.rpc('search_faqs', {
      p_query: question,
      p_limit: topK
    });

    if (searchError) {
      console.error('Error searching FAQs:', searchError);
    }

    // Check if we have good matches (similarity score > 0.1)
    const relevantFaqs = faqs?.filter((faq: any) => faq.similarity_score > 0.1) || [];
    
    let response = '';
    let source = 'database';
    let faqId = null;
    let similarityScore = null;

    if (relevantFaqs.length > 0) {
      // Use the best FAQ match
      const bestFaq = relevantFaqs[0];
      response = bestFaq.answer;
      faqId = bestFaq.id;
      similarityScore = bestFaq.similarity_score;
      
      // Add similar questions if available
      if (relevantFaqs.length > 1) {
        const similarQuestions = relevantFaqs.slice(1).map((faq: any) => faq.question);
        response += `\n\n**Perguntas relacionadas:**\n${similarQuestions.map(q => `• ${q}`).join('\n')}`;
      }
    } else {
      // No relevant FAQ found, use AI
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
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

Responda de forma clara, objetiva e profissional. Se não souber a resposta específica sobre o sistema ORDI, seja honesto e sugira que o usuário consulte a documentação ou entre em contato com o suporte.`
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_completion_tokens: 500,
        }),
      });

      const aiData = await aiResponse.json();
      
      if (!aiResponse.ok) {
        throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
      }

      response = aiData.choices[0].message.content;
      source = 'ai';
    }

    // Log the query
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, company_id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          await supabase.from('faq_queries').insert({
            company_id: profile.company_id,
            user_id: profile.id,
            question,
            response,
            response_source: source,
            faq_id: faqId,
            similarity_score: similarityScore
          });
        }
      }
    }

    // Log activity
    await supabase.rpc('log_client_event', {
      p_action: 'faq_query',
      p_details: {
        question: question.substring(0, 100),
        response_source: source,
        similarity_score: similarityScore,
        found_faqs: relevantFaqs.length
      }
    });

    return new Response(
      JSON.stringify({
        response,
        source,
        similarity_score: similarityScore,
        related_faqs: relevantFaqs.length > 1 ? relevantFaqs.slice(1, 3) : []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in FAQ assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        source: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});