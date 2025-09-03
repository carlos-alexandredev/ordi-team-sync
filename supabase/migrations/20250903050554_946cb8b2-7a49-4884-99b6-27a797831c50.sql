
-- 1) Garante que o bucket 'floorplans' exista e esteja público
insert into storage.buckets (id, name, public)
values ('floorplans', 'floorplans', true)
on conflict (id) do update set public = excluded.public;

-- 2) Políticas no storage.objects para o bucket 'floorplans'

-- Leitura pública (opcional, mas útil mesmo com bucket público,
-- para assegurar SELECT via SDK/SQL)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'floorplans_public_read'
  ) then
    create policy "floorplans_public_read"
      on storage.objects for select
      using (bucket_id = 'floorplans');
  end if;
end
$$;

-- Admin master pode gerenciar tudo
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'floorplans_admin_master_all'
  ) then
    create policy "floorplans_admin_master_all"
      on storage.objects for all
      using (bucket_id = 'floorplans' and public.is_admin_master())
      with check (bucket_id = 'floorplans' and public.is_admin_master());
  end if;
end
$$;

-- Demais papéis da empresa podem gerenciar objetos com prefixo do próprio company_id
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'floorplans_company_users_manage_own'
  ) then
    create policy "floorplans_company_users_manage_own"
      on storage.objects for all
      using (
        bucket_id = 'floorplans'
        and (public.get_user_role() = any (array['admin','admin_cliente','supervisor','tecnico','cliente_final']))
        and (name like public.get_user_company()::text || '/%')
      )
      with check (
        bucket_id = 'floorplans'
        and (public.get_user_role() = any (array['admin','admin_cliente','supervisor','tecnico','cliente_final']))
        and (name like public.get_user_company()::text || '/%')
      );
  end if;
end
$$;
