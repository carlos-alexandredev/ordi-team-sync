-- Corrigir avisos de segurança - adicionar security definer e search_path

-- Atualizar função generate_order_number com security definer e search_path
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Buscar o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.service_orders
  WHERE order_number LIKE TO_CHAR(NOW(), 'YYYY') || '%';
  
  -- Formatar como YYYY-NNNNNN
  order_num := TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  
  RETURN order_num;
END;
$$;

-- Atualizar função update_updated_at_column com security definer e search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Atualizar função set_order_number com security definer e search_path
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Atualizar função handle_new_user com search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;