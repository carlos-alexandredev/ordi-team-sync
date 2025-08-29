-- Fix RLS policies for FAQs to properly include admin_master
DROP POLICY IF EXISTS "Admins podem criar FAQs da empresa" ON public.faqs;
DROP POLICY IF EXISTS "Admins podem atualizar FAQs da empresa" ON public.faqs;
DROP POLICY IF EXISTS "Admins podem excluir FAQs da empresa" ON public.faqs;
DROP POLICY IF EXISTS "Usuários podem ver FAQs publicadas da empresa" ON public.faqs;

-- Create new policies with proper admin_master access
CREATE POLICY "Admins podem criar FAQs da empresa" 
ON public.faqs 
FOR INSERT 
WITH CHECK (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Admins podem atualizar FAQs da empresa" 
ON public.faqs 
FOR UPDATE 
USING (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
)
WITH CHECK (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Admins podem excluir FAQs da empresa" 
ON public.faqs 
FOR DELETE 
USING (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Usuários podem ver FAQs publicadas da empresa" 
ON public.faqs 
FOR SELECT 
USING (
  is_admin_master() OR (
    company_id = get_user_company() AND (
      status = 'published' OR 
      (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text]))
    )
  )
);

-- Also fix FAQ categories policies
DROP POLICY IF EXISTS "Admins podem criar categorias de FAQ da empresa" ON public.faq_categories;
DROP POLICY IF EXISTS "Admins podem atualizar categorias de FAQ da empresa" ON public.faq_categories;
DROP POLICY IF EXISTS "Admins podem excluir categorias de FAQ da empresa" ON public.faq_categories;
DROP POLICY IF EXISTS "Usuários podem ver categorias de FAQ da empresa" ON public.faq_categories;

CREATE POLICY "Admins podem criar categorias de FAQ da empresa" 
ON public.faq_categories 
FOR INSERT 
WITH CHECK (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Admins podem atualizar categorias de FAQ da empresa" 
ON public.faq_categories 
FOR UPDATE 
USING (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
)
WITH CHECK (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Admins podem excluir categorias de FAQ da empresa" 
ON public.faq_categories 
FOR DELETE 
USING (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'gestor'::text])) 
    AND company_id = get_user_company()
  )
);

CREATE POLICY "Usuários podem ver categorias de FAQ da empresa" 
ON public.faq_categories 
FOR SELECT 
USING (
  is_admin_master() OR company_id = get_user_company()
);

-- Fix FAQ queries policies  
DROP POLICY IF EXISTS "Admins podem ver consultas de FAQ da empresa" ON public.faq_queries;

CREATE POLICY "Admins podem ver consultas de FAQ da empresa" 
ON public.faq_queries 
FOR SELECT 
USING (
  is_admin_master() OR (
    (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text])) 
    AND company_id = get_user_company()
  )
);