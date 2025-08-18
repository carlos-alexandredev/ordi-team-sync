-- Adicionar colunas de ID amigável com incremento automático

-- Para chamados
ALTER TABLE calls ADD COLUMN IF NOT EXISTS friendly_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_friendly_id ON calls(friendly_id);

-- Para ordens
ALTER TABLE orders ADD COLUMN IF NOT EXISTS friendly_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_friendly_id ON orders(friendly_id);

-- Para equipamentos
ALTER TABLE equipments ADD COLUMN IF NOT EXISTS friendly_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipments_friendly_id ON equipments(friendly_id);

-- Para empresas
ALTER TABLE companies ADD COLUMN IF NOT EXISTS friendly_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_friendly_id ON companies(friendly_id);

-- Para profiles (usuários)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friendly_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_friendly_id ON profiles(friendly_id);