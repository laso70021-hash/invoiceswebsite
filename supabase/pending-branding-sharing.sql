-- Pending: apply ONLY to app backend ylgmukdwyrrffiouzvos using its SQL editor.
-- Applied through the connected Lovable database tool on 2026-10-28. Do not rerun.
begin;
alter table public.profiles add column if not exists logo_url text;
alter table public.profiles add column if not exists whatsapp_number text;
alter table public.profiles add column if not exists document_customization jsonb not null default '{}'::jsonb;

-- Business logos are public branding assets. No private documents go in this bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('business-logos','business-logos',true,2097152,array['image/png','image/jpeg'])
on conflict (id) do nothing;
create policy "Business owners upload logos" on storage.objects for insert to authenticated
with check (bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Business owners delete logos" on storage.objects for delete to authenticated
using (bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Business owners list logos" on storage.objects for select to authenticated
using (bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);

create table public.invoice_shares (
  invoice_id uuid primary key references public.invoices(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete set null,
  token uuid not null unique default gen_random_uuid(),
  public_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.invoice_shares enable row level security;
revoke all on public.invoice_shares from anon, authenticated;

-- Explicit owner checks protect every mutation. Recipient lookup does not reveal account existence.
create function public.create_invoice_share(_invoice uuid, _recipient_email text, _public boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if auth.uid() is null or not public.is_active(auth.uid()) or not exists(select 1 from public.invoices where id=_invoice and user_id=auth.uid()) then
    raise exception 'Invoice not found or access denied';
  end if;
  insert into public.invoice_shares(invoice_id,owner_id,recipient_id,public_enabled)
  values(_invoice,auth.uid(),(select id from auth.users where lower(email)=lower(trim(_recipient_email)) and email_confirmed_at is not null limit 1),_public)
  on conflict(invoice_id) do update set recipient_id=excluded.recipient_id, public_enabled=excluded.public_enabled, token=gen_random_uuid()
  returning token into result;
  return result;
end $$;

create function public.get_shared_invoice(_token uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',i.id,'number',i.number,'issue_date',i.issue_date,'due_date',i.due_date,'currency',i.currency,
    'items',i.items,'subtotal',i.subtotal,'tax',i.tax,'tax_rate',i.tax_rate,'total',i.total,'amount_paid',i.amount_paid,'status',i.status,'notes',i.notes,
    'customer_name',c.name,'customer_address',c.address,
    'business',jsonb_build_object('business_name',p.business_name,'address',p.address,'email',p.email,'phone',p.phone,'tax_id',p.tax_id,'payment_instructions',p.payment_instructions,'template_style',p.template_style,'brand_color',p.brand_color,'logo_url',p.logo_url,'whatsapp_number',p.whatsapp_number,'document_customization',p.document_customization)
  ) from public.invoice_shares s join public.invoices i on i.id=s.invoice_id and i.user_id=s.owner_id
  join public.profiles p on p.id=i.user_id left join public.customers c on c.id=i.customer_id and c.user_id=i.user_id
  where s.token=_token and public.is_active(s.owner_id)
  and (s.public_enabled or (auth.uid() is not null and public.is_active(auth.uid()) and auth.uid() in (s.owner_id,s.recipient_id)));
$$;
create function public.received_invoices() returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('token',s.token,'number',i.number,'business_name',p.business_name,'total',i.total,'currency',i.currency,'issue_date',i.issue_date)), '[]'::jsonb)
  from public.invoice_shares s join public.invoices i on i.id=s.invoice_id and i.user_id=s.owner_id join public.profiles p on p.id=s.owner_id
  where auth.uid() is not null and public.is_active(auth.uid()) and s.recipient_id=auth.uid() and public.is_active(s.owner_id);
$$;
create function public.revoke_invoice_share(_invoice uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.is_active(auth.uid()) then raise exception 'Access denied'; end if;
  delete from public.invoice_shares where invoice_id=_invoice and owner_id=auth.uid();
end $$;
revoke all on function public.create_invoice_share(uuid,text,boolean) from public,anon;
revoke all on function public.get_shared_invoice(uuid) from public;
revoke all on function public.received_invoices() from public,anon;
revoke all on function public.revoke_invoice_share(uuid) from public,anon;
grant execute on function public.create_invoice_share(uuid,text,boolean),public.received_invoices(),public.revoke_invoice_share(uuid) to authenticated;
grant execute on function public.get_shared_invoice(uuid) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
