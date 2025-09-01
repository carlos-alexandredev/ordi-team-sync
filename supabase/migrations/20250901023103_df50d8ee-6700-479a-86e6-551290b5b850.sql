
-- 1) Permitir company_id nulo em faq_queries para que admin_master (sem empresa) consiga logar conversas
ALTER TABLE public.faq_queries
  ALTER COLUMN company_id DROP NOT NULL;

-- 2) Ajustar função de busca para compatibilizar tipo da coluna similarity_score
CREATE OR REPLACE FUNCTION public.search_faqs(p_query text, p_limit integer DEFAULT 5)
RETURNS TABLE(
  id uuid,
  question text,
  answer text,
  category text,
  similarity_score numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  search_query tsquery;
  user_company UUID;
BEGIN
  -- Get user company
  SELECT company_id INTO user_company 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Create search query
  search_query := plainto_tsquery('portuguese', p_query);
  
  RETURN QUERY
  SELECT 
    f.id,
    f.question,
    f.answer,
    f.category,
    ts_rank(f.search_vector, search_query)::numeric as similarity_score,
    f.created_at
  FROM public.faqs f
  WHERE f.company_id = user_company
    AND f.status = 'published'
    AND f.search_vector @@ search_query
  ORDER BY ts_rank(f.search_vector, search_query) DESC
  LIMIT p_limit;
END;
$function$;
