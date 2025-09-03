
-- Garantir bucket (se já existir, não causa erro por conflito)
insert into storage.buckets (id, name, public)
values ('floorplans', 'floorplans', true)
on conflict (id) do nothing;

-- Permitir leitura pública de arquivos do bucket 'floorplans'
create policy if not exists "Public read floorplans"
on storage.objects for select
using (bucket_id = 'floorplans');

-- Permitir upload/atualização a usuários autenticados no bucket 'floorplans'
create policy if not exists "Authenticated upload floorplans"
on storage.objects for insert to authenticated
with check (bucket_id = 'floorplans');

create policy if not exists "Authenticated update floorplans"
on storage.objects for update to authenticated
using (bucket_id = 'floorplans')
with check (bucket_id = 'floorplans');

-- Permitir deleção a perfis de staff no bucket 'floorplans'
create policy if not exists "Staff delete floorplans"
on storage.objects for delete to authenticated
using (
  bucket_id = 'floorplans'
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin_master','admin','admin_cliente','supervisor','tecnico')
  )
);
