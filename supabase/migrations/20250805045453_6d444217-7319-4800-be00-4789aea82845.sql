-- Inserir módulo da agenda dos técnicos
INSERT INTO public.system_modules (name, title, url, icon, description, is_active) 
VALUES (
  'technician-schedule',
  'Agenda dos Técnicos',
  '/technician-schedule',
  'calendar',
  'Calendário e agendamento de tarefas para técnicos',
  true
)
ON CONFLICT (name) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;