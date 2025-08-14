-- Criar triggers de log apenas para tabelas existentes
DO $$
DECLARE
    table_name TEXT;
    tables_to_audit TEXT[] := ARRAY[
        'profiles', 'companies', 'equipments', 'orders', 'calls', 
        'tasks', 'task_products', 'task_services', 'maintenance_orders', 'maintenance_plans'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_audit
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            -- Verificar se o trigger já existe
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.triggers 
                WHERE trigger_name = format('audit_%s_changes', table_name)
            ) THEN
                -- Criar trigger para a tabela
                EXECUTE format('
                    CREATE TRIGGER audit_%I_changes
                    AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION log_table_changes();
                ', table_name, table_name);
                
                RAISE NOTICE 'Trigger criado para tabela: %', table_name;
            ELSE
                RAISE NOTICE 'Trigger já existe para tabela: %', table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Tabela não encontrada: %', table_name;
        END IF;
    END LOOP;
END $$;