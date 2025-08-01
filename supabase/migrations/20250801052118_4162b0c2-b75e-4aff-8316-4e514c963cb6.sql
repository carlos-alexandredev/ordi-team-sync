-- 1. Verificar as constraints atuais na tabela profiles
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
    AND contype = 'c';

-- 2. Verificar os valores permitidos pela constraint atual (se houver)
\d+ public.profiles

-- 3. Remover a constraint problemática se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check' 
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

-- 4. Criar uma nova constraint mais flexível que aceita valores comuns
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'admin_cliente', 'cliente_final', 'tecnico', 'user', 'moderator'));

-- 5. Atualizar a função handle_new_user para garantir que sempre defina um role válido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente_final') -- Fallback padrão
  );
  RETURN NEW;
END;
$function$;