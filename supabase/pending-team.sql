-- Apply only to the application's backend ylgmukdwyrrffiouzvos.
-- Applied through the connected Lovable database tool on 2026-10-28. Do not rerun.
-- Team access is read-only and separate from owner-scoped personal workspace queries.
begin;
create table public.business_team_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','accountant')),
  joined_at timestamptz not null default now(),
  primary key(owner_id,member_id), check(owner_id<>member_id)
);
create index business_team_member_lookup on public.business_team_members(member_id,owner_id);
create table public.business_team_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null check(email=lower(trim(email)) and length(email)<=254),
  role text not null check(role in ('viewer','accountant')),
  expires_at timestamptz not null default now()+interval '7 days',
  unique(owner_id,email)
);
create table public.business_team_events (
  id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null, action text not null, target_id uuid, created_at timestamptz not null default now()
);
create index business_team_events_owner_date on public.business_team_events(owner_id,created_at desc);
alter table public.business_team_members enable row level security;
alter table public.business_team_invites enable row level security;
alter table public.business_team_events enable row level security;
revoke all on public.business_team_members,public.business_team_invites,public.business_team_events from anon,authenticated;

create function public.team_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not public.is_active(uid) then raise exception 'Sign in with an active account'; end if;
  return jsonb_build_object(
    'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.member_id,'email',u.email,'name',p.full_name,'role',m.role,'joined_at',m.joined_at)) from public.business_team_members m join auth.users u on u.id=m.member_id left join public.profiles p on p.id=m.member_id where m.owner_id=uid),'[]'::jsonb),
    'invites',coalesce((select jsonb_agg(jsonb_build_object('id',id,'email',email,'role',role,'expires_at',expires_at)) from public.business_team_invites where owner_id=uid),'[]'::jsonb),
    'businesses',coalesce((select jsonb_agg(jsonb_build_object('id',m.owner_id,'name',p.business_name,'role',m.role)) from public.business_team_members m join public.profiles p on p.id=m.owner_id where m.member_id=uid and public.is_active(m.owner_id)),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e)) from (select action,created_at from public.business_team_events where owner_id=uid order by created_at desc limit 30)e),'[]'::jsonb)
  );
end $$;

create function public.manage_team(_action text,_target uuid default null,_email text default null,_role text default 'viewer') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); invite public.business_team_invites; result uuid; actor_email text;
begin
  if uid is null or not public.is_active(uid) then raise exception 'Sign in with an active account'; end if;
  if _role not in ('viewer','accountant') then raise exception 'Invalid team role'; end if;
  if _action='accept' then
    select * into invite from public.business_team_invites where id=_target for update;
    select lower(email) into actor_email from auth.users where id=uid and email_confirmed_at is not null;
    if invite.id is null or invite.expires_at<=now() or actor_email is distinct from invite.email or invite.owner_id=uid or not public.is_active(invite.owner_id) then raise exception 'Invitation unavailable. Sign in with the verified invited email.'; end if;
    insert into public.business_team_members(owner_id,member_id,role) values(invite.owner_id,uid,invite.role)
      on conflict(owner_id,member_id) do nothing;
    delete from public.business_team_invites where id=invite.id;
    insert into public.business_team_events(owner_id,actor_id,action,target_id) values(invite.owner_id,uid,'accepted invitation',uid);
    return jsonb_build_object('owner',invite.owner_id);
  elsif _action='invite' then
    if _email is null or length(trim(_email))>254 or trim(_email)!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email'; end if;
    if lower(trim(_email))=(select lower(email) from auth.users where id=uid) then raise exception 'You already own this business'; end if;
    if exists(select 1 from public.business_team_members m join auth.users u on u.id=m.member_id where m.owner_id=uid and lower(u.email)=lower(trim(_email))) then raise exception 'This account is already a member'; end if;
    insert into public.business_team_invites(owner_id,email,role) values(uid,lower(trim(_email)),_role)
      on conflict(owner_id,email) do update set id=gen_random_uuid(),role=excluded.role,expires_at=now()+interval '7 days' returning id into result;
    insert into public.business_team_events(owner_id,actor_id,action,target_id) values(uid,uid,'created invitation',result);
    return jsonb_build_object('token',result);
  elsif _action='revoke' then
    delete from public.business_team_invites where owner_id=uid and id=_target returning id into result;
  elsif _action='remove' then
    delete from public.business_team_members where owner_id=uid and member_id=_target returning member_id into result;
  elsif _action='role' then
    update public.business_team_members set role=_role where owner_id=uid and member_id=_target returning member_id into result;
  elsif _action='leave' then
    delete from public.business_team_members where owner_id=_target and member_id=uid returning owner_id into result;
    if result is null then raise exception 'Membership not found'; end if;
    insert into public.business_team_events(owner_id,actor_id,action,target_id) values(result,uid,'left team',uid);
    return '{}'::jsonb;
  else raise exception 'Unsupported action';
  end if;
  if result is null then raise exception 'Record not found or access denied'; end if;
  insert into public.business_team_events(owner_id,actor_id,action,target_id) values(uid,uid,_action,result);
  return '{}'::jsonb;
end $$;

-- Membership is rechecked on each read, so removal takes effect immediately.
-- Only minimal financial metadata is returned; no customer contacts, line items or storage access.
create function public.team_financial_records(_owner uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); team_role text;
begin
  if uid is null or not public.is_active(uid) or not public.is_active(_owner) then raise exception 'Access denied'; end if;
  if uid=_owner then team_role:='accountant'; else select role into team_role from public.business_team_members where owner_id=_owner and member_id=uid; end if;
  if team_role is null then raise exception 'Access denied'; end if;
  return jsonb_build_object(
    'business_name',(select business_name from public.profiles where id=_owner),
    'invoices',coalesce((select jsonb_agg(to_jsonb(i)) from (select id,number,issue_date,currency,status,total,amount_paid from public.invoices where user_id=_owner and status in ('sent','partial','paid') order by issue_date desc)i),'[]'::jsonb),
    'payments',case when team_role='accountant' then coalesce((select jsonb_agg(to_jsonb(p)) from (select p.id,p.amount,p.paid_on,p.method,i.currency,i.number from public.payments p join public.invoices i on i.id=p.invoice_id and i.user_id=_owner where p.user_id=_owner order by p.paid_on desc)p),'[]'::jsonb) else '[]'::jsonb end
  );
end $$;
revoke all on function public.team_overview(),public.manage_team(text,uuid,text,text),public.team_financial_records(uuid) from public,anon;
grant execute on function public.team_overview(),public.manage_team(text,uuid,text,text),public.team_financial_records(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
