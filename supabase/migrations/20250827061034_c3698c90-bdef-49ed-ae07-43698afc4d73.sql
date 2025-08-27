-- Create FAQ tables and functions

-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create FAQ categories table
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ queries log table
CREATE TABLE public.faq_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  question TEXT NOT NULL,
  response_source TEXT NOT NULL CHECK (response_source IN ('database', 'ai')),
  response TEXT,
  faq_id UUID REFERENCES public.faqs(id),
  similarity_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_queries ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_faqs_company_id ON public.faqs(company_id);
CREATE INDEX idx_faqs_status ON public.faqs(status);
CREATE INDEX idx_faqs_search_vector ON public.faqs USING gin(search_vector);
CREATE INDEX idx_faq_categories_company_id ON public.faq_categories(company_id);
CREATE INDEX idx_faq_queries_company_id ON public.faq_queries(company_id);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_faq_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, '') || ' ' || COALESCE(array_to_string(NEW.tags, ' '), ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
CREATE TRIGGER update_faq_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_faq_search_vector();

-- Create function to search FAQs
CREATE OR REPLACE FUNCTION public.search_faqs(
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  similarity_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    ts_rank(f.search_vector, search_query) as similarity_score,
    f.created_at
  FROM public.faqs f
  WHERE f.company_id = user_company
    AND f.status = 'published'
    AND f.search_vector @@ search_query
  ORDER BY ts_rank(f.search_vector, search_query) DESC
  LIMIT p_limit;
END;
$$;

-- RLS Policies for FAQs
CREATE POLICY "Admins podem gerenciar FAQs da empresa" 
ON public.faqs 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
);

CREATE POLICY "Usuários podem ver FAQs publicadas da empresa" 
ON public.faqs 
FOR SELECT 
USING (
  company_id = get_user_company() 
  AND status = 'published'
);

-- RLS Policies for FAQ Categories
CREATE POLICY "Admins podem gerenciar categorias de FAQ da empresa" 
ON public.faq_categories 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
);

CREATE POLICY "Usuários podem ver categorias de FAQ da empresa" 
ON public.faq_categories 
FOR SELECT 
USING (company_id = get_user_company());

-- RLS Policies for FAQ Queries
CREATE POLICY "Usuários podem registrar consultas de FAQ" 
ON public.faq_queries 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company() 
  AND user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins podem ver consultas de FAQ da empresa" 
ON public.faq_queries 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
);

-- Add audit triggers
CREATE TRIGGER audit_faqs
  AFTER INSERT OR UPDATE OR DELETE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();

CREATE TRIGGER audit_faq_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();

-- Update timestamp trigger
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();