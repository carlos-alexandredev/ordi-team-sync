-- Fix security issues: add search_path to functions
CREATE OR REPLACE FUNCTION public.generate_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(input_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment until unique
  WHILE EXISTS (SELECT 1 FROM public.modules WHERE slug = final_slug AND deleted_at IS NULL) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_module_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_name text;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_name := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    event_name := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    event_name := 'delete';
  END IF;

  -- Log the event
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      actor_user_id, event, entity, entity_id, before, after
    ) VALUES (
      auth.uid(), event_name, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs (
      actor_user_id, event, entity, entity_id, before, after
    ) VALUES (
      auth.uid(), event_name, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$;