-- Criar trigger de logs para todas as tabelas principais
CREATE OR REPLACE FUNCTION add_audit_triggers() RETURNS void AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- Lista de tabelas para adicionar triggers de auditoria
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'companies', 'equipments', 'orders', 'calls', 
            'tasks', 'task_products', 'task_services', 'suppliers',
            'maintenance_orders', 'maintenance_plans'
        ])
    LOOP
        -- Verifica se o trigger já existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = format('audit_%s_changes', table_name)
        ) THEN
            -- Criar trigger para cada tabela
            EXECUTE format('
                CREATE TRIGGER audit_%I_changes
                AFTER INSERT OR UPDATE OR DELETE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION log_table_changes();
            ', table_name, table_name);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função para criar os triggers
SELECT add_audit_triggers();

-- Remover a função temporária
DROP FUNCTION add_audit_triggers();