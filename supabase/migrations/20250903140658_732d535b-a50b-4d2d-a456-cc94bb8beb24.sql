
-- 1) Garantir que o bucket 'floorplans' exista e seja público
insert into storage.buckets (id, name, public)
values ('floorplans', 'floorplans', true)
on conflict (id) do nothing;

-- 2) Permitir leitura pública (SELECT) no bucket 'floorplans'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Public can read floorplans'
  ) then
    create policy "Public can read floorplans"
      on storage.objects for select
      to public
      using (bucket_id = 'floorplans');
  end if;
end$$;

-- 3) Permitir upload (INSERT) para perfis autorizados no bucket 'floorplans'
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Admins can upload floorplans'
  ) then
    create policy "Admins can upload floorplans"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'floorplans'
        and (
          public.is_admin_master()
          or public.get_user_role() in ('admin','admin_cliente','gestor','supervisor','tecnico')
        )
      );
  end if;
end$$;
