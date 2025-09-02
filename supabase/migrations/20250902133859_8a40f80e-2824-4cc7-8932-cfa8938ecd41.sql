-- Create system_settings table for centralized configuration
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admin_master can manage system settings
CREATE POLICY "Admin master pode gerenciar configurações do sistema"
ON public.system_settings
FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- Everyone can read public settings (like Mapbox token)
CREATE POLICY "Todos podem ver configurações públicas"
ON public.system_settings
FOR SELECT
USING (key IN ('mapbox_public_token', 'app_name', 'app_logo'));

-- Function to get public settings safely
CREATE OR REPLACE FUNCTION public.get_public_setting(setting_key text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.system_settings 
  WHERE key = setting_key 
  AND key IN ('mapbox_public_token', 'app_name', 'app_logo')
  LIMIT 1;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Mapbox token setting if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES ('mapbox_public_token', '', 'Token público do Mapbox para mapas interativos')
ON CONFLICT (key) DO NOTHING;