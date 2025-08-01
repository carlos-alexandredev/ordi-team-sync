-- Create table for storing questionnaire responses
CREATE TABLE public.order_questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for questionnaire responses
CREATE POLICY "Usuários podem ver respostas de ordens que têm acesso" 
ON public.order_questionnaire_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND (
      (get_user_role() = 'cliente_final' AND orders.client_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
      OR 
      (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR 
      (get_user_role() = 'admin')
    )
  )
);

CREATE POLICY "Técnicos podem criar/atualizar respostas" 
ON public.order_questionnaire_responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND (
      orders.technician_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
      OR
      (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR 
      (get_user_role() = 'admin')
    )
  )
);

CREATE POLICY "Técnicos podem atualizar respostas" 
ON public.order_questionnaire_responses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND (
      orders.technician_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
      OR
      (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR 
      (get_user_role() = 'admin')
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_questionnaire_responses_updated_at
BEFORE UPDATE ON public.order_questionnaire_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();