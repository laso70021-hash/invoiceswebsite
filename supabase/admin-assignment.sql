-- Run only in the SQL editor of this app's backend: ylgmukdwyrrffiouzvos.
-- Prepared for the requested user; NOT executed by Codex (project access denied).
-- Uses the existing role table; never grants roles through editable auth metadata.
begin;
do $$
begin
  if not exists (select 1 from auth.users where id = '3644a703-840e-40f7-9260-12fb42ef6b14'::uuid) then
    raise exception 'Requested user does not exist in this backend';
  end if;
  insert into public.user_roles (user_id, role)
  select '3644a703-840e-40f7-9260-12fb42ef6b14'::uuid, 'admin'
  where not exists (
    select 1 from public.user_roles
    where user_id = '3644a703-840e-40f7-9260-12fb42ef6b14'::uuid and role = 'admin'
  );
end $$;
select public.has_role('3644a703-840e-40f7-9260-12fb42ef6b14'::uuid, 'admin') as is_admin;
commit;
