-- Atualizar cliente para ter empresa associada
UPDATE profiles 
SET company_id = '4f6ca702-f26a-4196-8088-a2a1a748a08e' 
WHERE id = '6f85ea4b-ced2-4266-9458-9a7665b5e6bc';

-- Inserir 10 ordens de exemplo
INSERT INTO orders (
  title, 
  description, 
  priority, 
  status, 
  client_id, 
  company_id, 
  technician_id, 
  scheduled_date
) VALUES 
(
  'Manutenção preventiva do sistema de segurança',
  'Verificação completa dos sensores de movimento, câmeras e sistema de alarme do edifício comercial',
  'média',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-06 09:00:00'
),
(
  'Instalação de novas câmeras IP',
  'Instalação de 4 câmeras IP de alta resolução no estacionamento da empresa',
  'alta',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-07 14:30:00'
),
(
  'Reparo no sistema de controle de acesso',
  'Substituição de leitor biométrico defeituoso na entrada principal',
  'alta',
  'em execução',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-05 10:00:00'
),
(
  'Configuração de backup de dados',
  'Implementação de sistema de backup automático para gravações de CFTV',
  'média',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-08 13:00:00'
),
(
  'Teste de funcionamento dos alarmes',
  'Teste completo de todos os sensores e sirenes do sistema de alarme',
  'baixa',
  'concluída',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-04 08:00:00'
),
(
  'Atualização de firmware das câmeras',
  'Atualização de software das câmeras de segurança para última versão',
  'média',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-09 11:00:00'
),
(
  'Instalação de central de monitoramento',
  'Instalação e configuração de nova central de monitoramento 24h',
  'alta',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-10 09:30:00'
),
(
  'Manutenção corretiva - câmera externa',
  'Reparo de câmera externa danificada por condições climáticas',
  'alta',
  'em execução',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-05 15:00:00'
),
(
  'Treinamento de operação do sistema',
  'Treinamento da equipe de segurança para operação do novo sistema',
  'baixa',
  'pendente',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-12 14:00:00'
),
(
  'Inspeção mensal de equipamentos',
  'Inspeção de rotina de todos os equipamentos de segurança instalados',
  'baixa',
  'concluída',
  '6f85ea4b-ced2-4266-9458-9a7665b5e6bc',
  '4f6ca702-f26a-4196-8088-a2a1a748a08e',
  '392be9f0-a935-4e72-b4a4-62afdcf1a17e',
  '2025-08-03 16:00:00'
);