-- Create faq_sessions table for managing user chat sessions
CREATE TABLE public.faq_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on faq_sessions
ALTER TABLE public.faq_sessions ENABLE ROW LEVEL SECURITY;

-- Add session_id to faq_queries
ALTER TABLE public.faq_queries 
ADD COLUMN session_id UUID REFERENCES public.faq_sessions(id);

-- Create RLS policies for faq_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.faq_sessions 
FOR SELECT 
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own sessions" 
ON public.faq_sessions 
FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own sessions" 
ON public.faq_sessions 
FOR UPDATE 
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view sessions from their company" 
ON public.faq_sessions 
FOR SELECT 
USING (
  is_admin_master() OR 
  ((get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text])) AND (company_id = get_user_company()))
);

-- Create index for better performance
CREATE INDEX idx_faq_sessions_user_active ON public.faq_sessions(user_id, is_active);
CREATE INDEX idx_faq_sessions_company_active ON public.faq_sessions(company_id, is_active);
CREATE INDEX idx_faq_queries_session_id ON public.faq_queries(session_id);

-- Create trigger to update last_activity
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.faq_sessions 
  SET last_activity = now() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_activity_trigger
  AFTER INSERT ON public.faq_queries
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.update_session_activity();