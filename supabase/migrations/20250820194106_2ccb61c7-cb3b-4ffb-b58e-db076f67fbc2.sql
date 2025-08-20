
-- 1) Tabela de vínculo de equipamentos com chamados
create table if not exists public.call_equipments (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  equipment_id uuid not null references public.equipments(id) on delete restrict,
  action_type text not null default 'manutenção',
  observations text,
  created_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_call_equipments_call_id on public.call_equipments(call_id);
create index if not exists idx_call_equipments_equipment_id on public.call_equipments(equipment_id);

-- 2) RLS
alter table public.call_equipments enable row level security;

-- SELECT: usuários podem ver equipamentos de chamados que têm acesso
-- Espelha a política de SELECT de call_attachments, verificando acesso ao chamado
drop policy if exists "Usuários podem ver equipamentos de chamados que têm acesso" on public.call_equipments;
create policy "Usuários podem ver equipamentos de chamados que têm acesso"
on public.call_equipments
for select
using (
  exists (
    select 1
    from public.calls
    where calls.id = call_equipments.call_id
      and (
        (public.get_user_role() = 'cliente_final' and calls.client_id = (select profiles.id from public.profiles where profiles.user_id = auth.uid()))
        or ((public.get_user_role() in ('admin', 'admin_cliente')) and calls.company_id = public.get_user_company())
        or (public.get_user_role() = 'admin')
        or public.is_admin_master()
      )
  )
);

-- INSERT: usuários podem vincular equipamentos aos chamados que têm acesso
-- Para clientes finais no próprio chamado e admin/admin_cliente da empresa
drop policy if exists "Usuários podem vincular equipamentos aos chamados" on public.call_equipments;
create policy "Usuários podem vincular equipamentos aos chamados"
on public.call_equipments
for insert
with check (
  exists (
    select 1
    from public.calls
    where calls.id = call_equipments.call_id
      and (
        (public.get_user_role() = 'cliente_final' and calls.client_id = (select profiles.id from public.profiles where profiles.user_id = auth.uid()))
        or ((public.get_user_role() in ('admin', 'admin_cliente')) and calls.company_id = public.get_user_company())
        or (public.get_user_role() = 'admin')
        or public.is_admin_master()
      )
  )
);
