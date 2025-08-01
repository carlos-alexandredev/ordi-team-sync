-- Criar tabela para respostas de questionários de ordens
CREATE TABLE public.order_questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver questionários de ordens que têm acesso"
ON public.order_questionnaire_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND (
      (get_user_role() = 'cliente_final' AND orders.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR ((get_user_role() = ANY(ARRAY['admin', 'admin_cliente'])) AND orders.company_id = get_user_company())
      OR (get_user_role() = 'admin')
    )
  )
);

CREATE POLICY "Técnicos podem criar/atualizar questionários de suas ordens"
ON public.order_questionnaire_responses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND orders.technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_questionnaire_responses.order_id 
    AND orders.technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_order_questionnaire_responses_updated_at
BEFORE UPDATE ON public.order_questionnaire_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();