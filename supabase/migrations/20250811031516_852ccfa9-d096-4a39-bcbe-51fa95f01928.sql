-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION public.calculate_maintenance_mttr()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'concluida' AND NEW.started_at IS NOT NULL AND NEW.finished_at IS NOT NULL THEN
    NEW.mttr_minutes := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$;