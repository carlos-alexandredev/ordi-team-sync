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
    const { csvData } = await req.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      throw new Error('CSV data is required');
    }

    console.log(`Processing ${csvData.length} lines`);

    // Get user and company info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const results = {
      success: 0,
      errors: [] as Array<{ line: number; message: string; data?: any }>
    };

    // Process each line
    for (const item of csvData) {
      try {
        const line = item.content;
        const lineNumber = item.line;
        
        // Parse CSV line (simple CSV parser)
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        columns.push(current.trim());

        // Validate required columns
        if (columns.length < 2) {
          results.errors.push({
            line: lineNumber,
            message: 'Linha deve ter pelo menos pergunta e resposta'
          });
          continue;
        }

        const [question, answer, category, status, tagsStr] = columns;

        if (!question || !answer) {
          results.errors.push({
            line: lineNumber,
            message: 'Pergunta e resposta são obrigatórias'
          });
          continue;
        }

        // Parse tags
        let tags = null;
        if (tagsStr && tagsStr.trim()) {
          tags = tagsStr.split(';').map(tag => tag.trim()).filter(Boolean);
        }

        // Validate status
        const validStatuses = ['published', 'draft', 'archived'];
        const faqStatus = status && validStatuses.includes(status.toLowerCase()) 
          ? status.toLowerCase() 
          : 'published';

        // Prepare FAQ data
        const faqData = {
          question: question.trim(),
          answer: answer.trim(),
          category: category?.trim() || null,
          status: faqStatus,
          tags,
          company_id: profile.company_id,
          created_by: profile.id,
          updated_by: profile.id,
        };

        // Check if FAQ already exists (by question)
        const { data: existing } = await supabase
          .from('faqs')
          .select('id')
          .eq('question', faqData.question)
          .eq('company_id', profile.company_id)
          .single();

        if (existing) {
          // Update existing FAQ
          const { error: updateError } = await supabase
            .from('faqs')
            .update({
              answer: faqData.answer,
              category: faqData.category,
              status: faqData.status,
              tags: faqData.tags,
              updated_by: faqData.updated_by,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            results.errors.push({
              line: lineNumber,
              message: `Erro ao atualizar FAQ: ${updateError.message}`,
              data: faqData
            });
          } else {
            results.success++;
          }
        } else {
          // Insert new FAQ
          const { error: insertError } = await supabase
            .from('faqs')
            .insert(faqData);

          if (insertError) {
            results.errors.push({
              line: lineNumber,
              message: `Erro ao inserir FAQ: ${insertError.message}`,
              data: faqData
            });
          } else {
            results.success++;
          }
        }

      } catch (error: any) {
        console.error(`Error processing line ${item.line}:`, error);
        results.errors.push({
          line: item.line,
          message: `Erro inesperado: ${error.message}`
        });
      }
    }

    console.log('Import completed:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in faq-import function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: 0,
        errors: [{ line: 0, message: error.message }]
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});