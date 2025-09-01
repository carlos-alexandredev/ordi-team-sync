import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { question, topK = 3 } = await req.json();
    
    if (!question) {
      console.error('Question is required');
      return new Response(JSON.stringify({
        answer: "Por favor, digite uma pergunta.",
        source: 'error',
        similarity_score: null,
        related_faqs: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing question: ${question}`);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({
        answer: "Erro de autenticação. Por favor, faça login novamente.",
        source: 'error',
        similarity_score: null,
        related_faqs: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user context with the auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(JSON.stringify({
        answer: "Erro de autenticação. Por favor, faça login novamente.",
        source: 'error',
        similarity_score: null,
        related_faqs: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({
        answer: "Erro ao buscar perfil do usuário. Tente novamente.",
        source: 'error',
        similarity_score: null,
        related_faqs: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User role: ${profile.role}, Company: ${profile.company_id}`);

    // Load AI settings (if available)
    let aiSettings = {
      topK: topK,
      similarity_threshold: 0.7,
      kb_only: false,
      enable_fallback: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      custom_model: null,
      assistant_id: null
    };

    try {
      const { data: moduleData } = await supabase
        .from('system_modules')
        .select('id')
        .eq('name', 'faq')
        .single();

      if (moduleData) {
        const { data: settings } = await supabase
          .from('module_settings')
          .select('*')
          .eq('module_id', moduleData.id)
          .in('key', ['topK', 'similarity_threshold', 'kb_only', 'enable_fallback', 'ai_provider', 'ai_model', 'custom_model', 'assistant_id']);

        if (settings && settings.length > 0) {
          const settingsMap = settings.reduce((acc, setting) => {
            const value = setting.value_text || setting.value_number || setting.value_boolean;
            acc[setting.key] = value;
            return acc;
          }, {} as any);

          aiSettings = {
            topK: settingsMap.topK || aiSettings.topK,
            similarity_threshold: settingsMap.similarity_threshold || aiSettings.similarity_threshold,
            kb_only: settingsMap.kb_only || aiSettings.kb_only,
            enable_fallback: settingsMap.enable_fallback !== false,
            provider: settingsMap.ai_provider || aiSettings.provider,
            model: settingsMap.ai_model || aiSettings.model,
            custom_model: settingsMap.custom_model,
            assistant_id: settingsMap.assistant_id
          };
        }
      }
    } catch (settingsError) {
      console.log('Could not load AI settings, using defaults:', settingsError);
    }

    console.log('AI Settings:', aiSettings);

    // Search FAQs first
    const { data: faqResults, error: searchError } = await supabase.rpc('search_faqs', {
      p_query: question,
      p_limit: aiSettings.topK
    });

    if (searchError) {
      console.error('Error searching FAQs:', searchError);
    }

    const faqs = faqResults || [];
    console.log(`Found ${faqs.length} relevant FAQs`);

    // Check if we have a good match from FAQ database
    const bestMatch = faqs[0];
    
    if (bestMatch && bestMatch.similarity_score >= aiSettings.similarity_threshold) {
      console.log(`Using FAQ answer with similarity ${bestMatch.similarity_score}`);
      
      // Log the query
      try {
        await supabase.from('faq_queries').insert({
          question,
          response: bestMatch.answer,
          response_source: 'database',
          similarity_score: bestMatch.similarity_score,
          faq_id: bestMatch.id,
          user_id: profile.id,
          company_id: profile.company_id
        });
      } catch (logError) {
        console.error('Error logging FAQ query:', logError);
      }

      return new Response(JSON.stringify({
        answer: bestMatch.answer,
        source: 'database',
        similarity_score: bestMatch.similarity_score,
        related_faqs: faqs.slice(1, 3).map(faq => ({
          question: faq.question,
          similarity: faq.similarity_score
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If KB only mode is enabled, return fallback
    if (aiSettings.kb_only || !aiSettings.enable_fallback) {
      console.log('KB-only mode or fallback disabled');
      return new Response(JSON.stringify({
        answer: faqs.length > 0 
          ? `Não encontrei uma resposta exata, mas aqui estão algumas perguntas relacionadas que podem ajudar:\n\n${faqs.slice(0, 2).map(faq => `• ${faq.question}`).join('\n')}\n\nPara mais informações, entre em contato com o suporte.`
          : "Desculpe, não encontrei informações sobre sua pergunta na nossa base de conhecimento. Por favor, entre em contato com o suporte para assistência.",
        source: 'fallback',
        similarity_score: null,
        related_faqs: faqs.slice(0, 3).map(faq => ({
          question: faq.question,
          similarity: faq.similarity_score
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check OpenAI availability
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log(`OpenAI key available: ${!!openAIApiKey}`);

    if (!openAIApiKey) {
      console.log('OpenAI not configured, using fallback');
      return new Response(JSON.stringify({
        answer: "Desculpe, não encontrei uma resposta específica para sua pergunta. Nossa IA está temporariamente indisponível. Por favor, entre em contato com o suporte para assistência personalizada.",
        source: 'fallback',
        similarity_score: null,
        related_faqs: faqs.slice(0, 3).map(faq => ({
          question: faq.question,
          similarity: faq.similarity_score
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use OpenAI as fallback
    console.log(`Calling OpenAI API with model: ${aiSettings.model}`);
    
    // Prepare context from available FAQs
    const faqContext = faqs.length > 0 
      ? `\n\nContexto de FAQs relacionados:\n${faqs.map(faq => `P: ${faq.question}\nR: ${faq.answer}`).join('\n\n')}`
      : '';

    const systemMessage = `Você é um assistente especializado em responder perguntas sobre o sistema ORDI (Sistema de Gestão de Ordens de Serviço). 

Suas responsabilidades:
- Responder perguntas sobre funcionalidades do sistema
- Ajudar com dúvidas técnicas e operacionais
- Fornecer orientações sobre uso do sistema
- Manter um tom profissional e prestativo

${faqContext}

Se você não souber a resposta específica, seja honesto e sugira entrar em contato com o suporte.`;

    try {
      let apiResponse;

      // Use Chat Completions API
      const model = aiSettings.custom_model || aiSettings.model;
      console.log(`Using Chat Completions with model: ${model}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: question }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      console.log(`OpenAI response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        
        // Handle quota exceeded gracefully
        if (response.status === 429 || (errorData.error && errorData.error.code === 'insufficient_quota')) {
          console.log('OpenAI quota exceeded, using fallback');
          return new Response(JSON.stringify({
            answer: "Desculpe, estamos enfrentando alta demanda no momento. Por favor, tente novamente em alguns minutos ou entre em contato com o suporte para assistência imediata.",
            source: 'fallback',
            similarity_score: null,
            related_faqs: faqs.slice(0, 3).map(faq => ({
              question: faq.question,
              similarity: faq.similarity_score
            }))
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      apiResponse = await response.json();

      const aiAnswer = apiResponse.choices[0].message.content;
      
      console.log('OpenAI response received successfully');

      // Log the AI query
      try {
        await supabase.from('faq_queries').insert({
          question,
          response: aiAnswer,
          response_source: 'ai',
          similarity_score: null,
          user_id: profile.id,
          company_id: profile.company_id
        });
      } catch (logError) {
        console.error('Error logging AI query:', logError);
      }

      return new Response(JSON.stringify({
        answer: aiAnswer,
        source: 'ai',
        similarity_score: null,
        related_faqs: faqs.slice(0, 3).map(faq => ({
          question: faq.question,
          similarity: faq.similarity_score
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (openAIError) {
      console.error('OpenAI request failed:', openAIError);
      
      return new Response(JSON.stringify({
        answer: "Desculpe, não consegui processar sua pergunta no momento. Por favor, tente novamente ou entre em contato com o suporte.",
        source: 'error',
        similarity_score: null,
        related_faqs: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in faq-assistant function:', error);
    return new Response(JSON.stringify({ 
      answer: "Ocorreu um erro interno. Por favor, tente novamente.",
      source: 'error',
      similarity_score: null,
      related_faqs: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
