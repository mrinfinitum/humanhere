begin;

create type public.help_need_type as enum (
  'groceries', 'clothing', 'household', 'transportation', 'utilities', 'school',
  'baby', 'employment', 'medical_nonclinical', 'housing', 'other'
);
create type public.help_need_status as enum (
  'draft', 'submitted', 'verifying', 'approved', 'partially_fulfilled',
  'fulfilled', 'rejected', 'archived'
);
create type public.help_verification_status as enum ('unverified', 'partner_verified', 'staff_verified');
create type public.help_delivery_mode as enum ('direct_private', 'partner_delivery', 'pickup_location', 'address_withheld');
create type public.help_partner_type as enum ('church', 'nonprofit', 'shelter', 'food_bank', 'school', 'community_org', 'other');
create type public.help_partner_status as enum ('pending', 'verified', 'active', 'suspended', 'archived');
create type public.help_partner_member_role as enum ('viewer', 'coordinator', 'admin');
create type public.help_staff_role as enum ('fulfillment');
create type public.help_partner_assignment_status as enum ('offered', 'accepted', 'in_progress', 'completed', 'declined', 'cancelled');
create type public.help_fulfillment_type as enum ('goods', 'grocery', 'voucher', 'partner_service', 'other');
create type public.help_fulfillment_status as enum ('pending', 'authorized', 'ordered', 'shipped', 'ready_for_pickup', 'delivered', 'failed', 'cancelled');
create type public.help_sensitive_action as enum (
  'view_fulfillment_profile', 'update_fulfillment_profile', 'view_private_need',
  'assign_partner', 'create_fulfillment_order', 'change_delivery_mode',
  'review_human_need', 'delete_fulfillment_profile'
);

create table public.help_feature_flags (
  key text primary key check (key = 'show_up_enabled'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.help_feature_flags (key, enabled) values ('show_up_enabled', false);

create table public.help_staff_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.help_staff_role not null default 'fulfillment',
  active boolean not null default true,
  granted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.help_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  partner_type public.help_partner_type not null,
  city text check (city is null or length(city) <= 160),
  state text check (state is null or length(state) <= 160),
  country text check (country is null or length(country) <= 160),
  public_contact_name text check (public_contact_name is null or length(public_contact_name) <= 160),
  public_website text check (public_website is null or length(public_website) <= 2048),
  internal_contact_name text check (internal_contact_name is null or length(internal_contact_name) <= 160),
  internal_email text check (internal_email is null or length(internal_email) <= 320),
  internal_phone text check (internal_phone is null or length(internal_phone) <= 40),
  status public.help_partner_status not null default 'pending',
  can_verify_needs boolean not null default false,
  can_receive_deliveries boolean not null default false,
  can_fulfill_needs boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.help_partner_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.help_partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.help_partner_member_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, user_id)
);

create table public.fulfillment_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  legal_delivery_name text check (legal_delivery_name is null or length(legal_delivery_name) <= 200),
  phone text check (phone is null or length(phone) <= 40),
  address_line_1 text check (address_line_1 is null or length(address_line_1) <= 200),
  address_line_2 text check (address_line_2 is null or length(address_line_2) <= 200),
  city text check (city is null or length(city) <= 160),
  state text check (state is null or length(state) <= 160),
  postal_code text check (postal_code is null or length(postal_code) <= 32),
  country text check (country is null or length(country) <= 160),
  delivery_notes text check (delivery_notes is null or length(delivery_notes) <= 2000),
  preferred_delivery_method text check (preferred_delivery_method is null or length(preferred_delivery_method) <= 120),
  preferred_delivery_mode public.help_delivery_mode not null default 'address_withheld',
  allow_tangible_help boolean not null default false,
  allow_partner_referral boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fulfillment_profile_verification_complete check (
    (verified_at is null and verified_by is null) or (verified_at is not null and verified_by is not null)
  )
);

create table public.help_consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  allow_help_requests boolean not null default false,
  allow_partner_contact boolean not null default false,
  allow_delivery boolean not null default false,
  allow_fulfillment_provider boolean not null default false,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint help_consent_revocation_valid check (revoked_at is null or revoked_at >= consented_at),
  constraint help_consent_is_explicit check (
    allow_help_requests or allow_partner_contact or allow_delivery or allow_fulfillment_provider
  )
);

create table public.human_needs (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid not null references public.human_entries(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  need_type public.help_need_type not null,
  public_title text not null check (length(btrim(public_title)) between 1 and 160),
  public_description text check (public_description is null or length(public_description) <= 2000),
  private_notes text check (private_notes is null or length(private_notes) <= 5000),
  quantity_needed integer not null default 1 check (quantity_needed between 1 and 1000000),
  quantity_fulfilled integer not null default 0 check (quantity_fulfilled between 0 and quantity_needed),
  status public.help_need_status not null default 'draft',
  verification_status public.help_verification_status not null default 'unverified',
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  partner_id uuid references public.help_partners(id) on delete set null,
  delivery_mode public.help_delivery_mode not null default 'address_withheld',
  publicly_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  constraint human_needs_id_recipient_unique unique (id, recipient_user_id),
  constraint human_need_verification_complete check (
    (verification_status = 'unverified' and verified_at is null and verified_by is null)
    or (verification_status <> 'unverified' and verified_at is not null and verified_by is not null)
  ),
  constraint human_need_publication_safe check (
    not publicly_visible
    or (
      verification_status <> 'unverified'
      and status in ('approved', 'partially_fulfilled', 'fulfilled')
    )
  ),
  constraint human_need_fulfillment_complete check (
    (status = 'fulfilled' and fulfilled_at is not null and quantity_fulfilled = quantity_needed)
    or status <> 'fulfilled'
  )
);

create table public.human_need_partner_assignments (
  id uuid primary key default gen_random_uuid(),
  human_need_id uuid not null references public.human_needs(id) on delete cascade,
  partner_id uuid not null references public.help_partners(id) on delete cascade,
  status public.help_partner_assignment_status not null default 'offered',
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  internal_notes text check (internal_notes is null or length(internal_notes) <= 5000),
  assigned_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  human_need_id uuid not null,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  partner_id uuid references public.help_partners(id) on delete set null,
  provider text not null default 'internal' check (
    provider in ('internal', 'partner', 'walmart', 'amazon', 'instacart', 'doordash', 'other')
  ),
  provider_order_reference text check (provider_order_reference is null or length(provider_order_reference) <= 500),
  fulfillment_type public.help_fulfillment_type not null,
  status public.help_fulfillment_status not null default 'pending',
  amount_cents bigint check (amount_cents is null or amount_cents >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  constraint fulfillment_order_need_recipient_fkey
    foreign key (human_need_id, recipient_user_id)
    references public.human_needs(id, recipient_user_id) on delete restrict,
  constraint fulfillment_order_delivered_at check (
    (status = 'delivered' and fulfilled_at is not null) or status <> 'delivered'
  )
);

create table public.sensitive_access_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  resource_type text not null check (resource_type in ('fulfillment_profile', 'human_need', 'partner_assignment', 'fulfillment_order')),
  resource_id uuid not null,
  action public.help_sensitive_action not null,
  created_at timestamptz not null default now()
);

create index help_partners_status_idx on public.help_partners (status, created_at desc, id desc);
create index help_partner_memberships_user_idx on public.help_partner_memberships (user_id, partner_id) where active = true;
create index fulfillment_profiles_verified_idx on public.fulfillment_profiles (verified_at) where verified_at is not null;
create index help_consent_user_created_idx on public.help_consent_records (user_id, created_at desc, id desc);
create index human_needs_recipient_idx on public.human_needs (recipient_user_id, created_at desc, id desc);
create index human_needs_status_idx on public.human_needs (status, verification_status, created_at asc, id asc);
create index human_needs_public_idx on public.human_needs (human_entry_id, created_at desc, id desc)
  where publicly_visible = true and verification_status <> 'unverified'
    and status in ('approved', 'partially_fulfilled', 'fulfilled');
create index help_assignments_partner_idx on public.human_need_partner_assignments (partner_id, status, assigned_at asc, id asc);
create index help_assignments_need_idx on public.human_need_partner_assignments (human_need_id, assigned_at desc, id desc);
create unique index help_assignments_active_unique_idx on public.human_need_partner_assignments (human_need_id, partner_id)
  where status in ('offered', 'accepted', 'in_progress');
create index fulfillment_orders_need_idx on public.fulfillment_orders (human_need_id, created_at desc, id desc);
create index fulfillment_orders_status_idx on public.fulfillment_orders (status, created_at asc, id asc);
create index sensitive_access_actor_idx on public.sensitive_access_events (actor_user_id, created_at desc, id desc);
create index sensitive_access_resource_idx on public.sensitive_access_events (resource_type, resource_id, created_at desc);

create trigger help_feature_flags_updated_at before update on public.help_feature_flags for each row execute function public.set_updated_at();
create trigger help_staff_updated_at before update on public.help_staff_memberships for each row execute function public.set_updated_at();
create trigger help_partners_updated_at before update on public.help_partners for each row execute function public.set_updated_at();
create trigger help_partner_memberships_updated_at before update on public.help_partner_memberships for each row execute function public.set_updated_at();
create trigger fulfillment_profiles_updated_at before update on public.fulfillment_profiles for each row execute function public.set_updated_at();
create trigger human_needs_updated_at before update on public.human_needs for each row execute function public.set_updated_at();
create trigger help_assignments_updated_at before update on public.human_need_partner_assignments for each row execute function public.set_updated_at();
create trigger fulfillment_orders_updated_at before update on public.fulfillment_orders for each row execute function public.set_updated_at();

create or replace function public.audit_fulfillment_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_user_id uuid;
begin
  profile_user_id := coalesce(new.user_id, old.user_id);
  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (
    auth.uid(),
    'fulfillment_profile',
    profile_user_id,
    case when tg_op = 'DELETE'
      then 'delete_fulfillment_profile'::public.help_sensitive_action
      else 'update_fulfillment_profile'::public.help_sensitive_action
    end
  );

  if tg_op = 'UPDATE' and new.preferred_delivery_mode is distinct from old.preferred_delivery_mode then
    insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
    values (auth.uid(), 'fulfillment_profile', profile_user_id, 'change_delivery_mode');
  end if;
  return coalesce(new, old);
end;
$$;

create trigger fulfillment_profiles_sensitive_audit
after insert or update or delete on public.fulfillment_profiles
for each row execute function public.audit_fulfillment_profile_change();

create or replace function public.is_show_up_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select enabled from public.help_feature_flags where key = 'show_up_enabled'), false);
$$;

create or replace function public.is_help_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    public.current_account_role() = 'admin'::public.account_role
    or exists (
      select 1 from public.help_staff_memberships
      where user_id = auth.uid() and active = true
    )
  );
$$;

create or replace function public.is_help_partner_member(p_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.help_partner_memberships
    where partner_id = p_partner_id and user_id = auth.uid() and active = true
  );
$$;

create or replace function public.owns_help_human_entry(p_human_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.human_entries
    where id = p_human_entry_id and subject_user_id = auth.uid()
  );
$$;

create or replace function public.is_public_help_human_entry(p_human_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.human_entries
    where id = p_human_entry_id
      and published = true
      and published_at is not null
      and (source = 'editorial' or consent_verified = true)
  );
$$;

create or replace function public.my_human_needs()
returns table (
  id uuid,
  human_entry_id uuid,
  need_type public.help_need_type,
  public_title text,
  public_description text,
  private_notes text,
  quantity_needed integer,
  quantity_fulfilled integer,
  status public.help_need_status,
  verification_status public.help_verification_status,
  delivery_mode public.help_delivery_mode,
  publicly_visible boolean,
  created_at timestamptz,
  updated_at timestamptz,
  fulfilled_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    n.id, n.human_entry_id, n.need_type, n.public_title, n.public_description,
    n.private_notes, n.quantity_needed, n.quantity_fulfilled, n.status,
    n.verification_status, n.delivery_mode, n.publicly_visible,
    n.created_at, n.updated_at, n.fulfilled_at
  from public.human_needs n
  where auth.uid() is not null and n.recipient_user_id = auth.uid()
  order by n.created_at desc, n.id desc;
$$;

create or replace function public.get_fulfillment_profile_for_help(p_user_id uuid)
returns table (
  user_id uuid,
  legal_delivery_name text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  delivery_notes text,
  preferred_delivery_method text,
  preferred_delivery_mode public.help_delivery_mode,
  allow_tangible_help boolean,
  allow_partner_referral boolean,
  verified_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_help_staff() then
    raise exception 'not authorized';
  end if;

  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (auth.uid(), 'fulfillment_profile', p_user_id, 'view_fulfillment_profile');

  return query
  select
    p.user_id, p.legal_delivery_name, p.phone, p.address_line_1, p.address_line_2,
    p.city, p.state, p.postal_code, p.country, p.delivery_notes,
    p.preferred_delivery_method, p.preferred_delivery_mode, p.allow_tangible_help,
    p.allow_partner_referral, p.verified_at, p.updated_at
  from public.fulfillment_profiles p
  where p.user_id = p_user_id;
end;
$$;

create or replace function public.get_private_human_need_for_help(p_human_need_id uuid)
returns table (
  id uuid,
  human_entry_id uuid,
  recipient_user_id uuid,
  need_type public.help_need_type,
  public_title text,
  public_description text,
  private_notes text,
  quantity_needed integer,
  quantity_fulfilled integer,
  status public.help_need_status,
  verification_status public.help_verification_status,
  partner_id uuid,
  delivery_mode public.help_delivery_mode,
  publicly_visible boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_help_staff() then
    raise exception 'not authorized';
  end if;

  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (auth.uid(), 'human_need', p_human_need_id, 'view_private_need');

  return query
  select
    n.id, n.human_entry_id, n.recipient_user_id, n.need_type, n.public_title,
    n.public_description, n.private_notes, n.quantity_needed, n.quantity_fulfilled,
    n.status, n.verification_status, n.partner_id, n.delivery_mode,
    n.publicly_visible, n.created_at, n.updated_at
  from public.human_needs n where n.id = p_human_need_id;
end;
$$;

create or replace function public.revoke_my_help_consent(p_consent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.help_consent_records
  set revoked_at = coalesce(revoked_at, now())
  where id = p_consent_id and user_id = auth.uid();
  return found;
end;
$$;

create or replace function public.review_help_need(
  p_human_need_id uuid,
  p_status public.help_need_status,
  p_verification_status public.help_verification_status,
  p_publicly_visible boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
  need_delivery_mode public.help_delivery_mode;
begin
  if not public.is_show_up_enabled() then
    raise exception 'show up is disabled';
  end if;
  if not public.is_help_staff() then
    raise exception 'not authorized';
  end if;
  if p_status not in ('verifying', 'approved', 'rejected') then
    raise exception 'unsupported review status';
  end if;
  if p_status = 'approved' and p_verification_status = 'unverified' then
    raise exception 'approved needs must be verified';
  end if;
  if p_publicly_visible and p_status <> 'approved' then
    raise exception 'only approved needs can become public';
  end if;

  select recipient_user_id, delivery_mode into recipient_id, need_delivery_mode
  from public.human_needs
  where id = p_human_need_id and status in ('submitted', 'verifying', 'rejected')
  for update;
  if not found then
    raise exception 'need is not reviewable';
  end if;

  if p_status = 'approved' and not exists (
    select 1
    from (
      select * from public.help_consent_records
      where user_id = recipient_id
      order by created_at desc, id desc
      limit 1
    ) latest
    where latest.revoked_at is null
      and latest.allow_help_requests = true
      and (need_delivery_mode <> 'direct_private' or latest.allow_delivery = true)
      and (need_delivery_mode <> 'partner_delivery' or latest.allow_partner_contact = true)
  ) then
    raise exception 'current help consent is required';
  end if;

  if p_publicly_visible and not public.is_public_help_human_entry(
    (select human_entry_id from public.human_needs where id = p_human_need_id)
  ) then
    raise exception 'need cannot be public without a public HumanEntry';
  end if;

  update public.human_needs
  set status = p_status,
      verification_status = case when p_status = 'approved' then p_verification_status else 'unverified' end,
      verified_at = case when p_status = 'approved' then now() else null end,
      verified_by = case when p_status = 'approved' then auth.uid() else null end,
      publicly_visible = case when p_status = 'approved' then p_publicly_visible else false end
  where id = p_human_need_id;

  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (auth.uid(), 'human_need', p_human_need_id, 'review_human_need');
  return true;
end;
$$;

create or replace function public.assign_help_partner(
  p_human_need_id uuid,
  p_partner_id uuid,
  p_internal_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignment_id uuid;
begin
  if not public.is_show_up_enabled() then
    raise exception 'show up is disabled';
  end if;
  if not public.is_help_staff() then
    raise exception 'not authorized';
  end if;
  if p_internal_notes is not null and length(p_internal_notes) > 5000 then
    raise exception 'internal notes are too long';
  end if;
  if not exists (
    select 1 from public.human_needs
    where id = p_human_need_id
      and status in ('verifying', 'approved', 'partially_fulfilled')
  ) then
    raise exception 'need is not assignable';
  end if;
  if not exists (
    select 1 from public.help_partners
    where id = p_partner_id and status in ('verified', 'active')
      and (can_verify_needs or can_receive_deliveries or can_fulfill_needs)
  ) then
    raise exception 'partner is not eligible';
  end if;

  insert into public.human_need_partner_assignments (
    human_need_id, partner_id, internal_notes, assigned_by
  ) values (
    p_human_need_id, p_partner_id, nullif(btrim(p_internal_notes), ''), auth.uid()
  ) returning id into assignment_id;

  update public.human_needs
  set partner_id = p_partner_id
  where id = p_human_need_id;

  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (auth.uid(), 'partner_assignment', assignment_id, 'assign_partner');

  return assignment_id;
end;
$$;

create or replace function public.create_help_fulfillment_order(
  p_human_need_id uuid,
  p_partner_id uuid,
  p_provider text,
  p_fulfillment_type public.help_fulfillment_type,
  p_amount_cents bigint default null,
  p_currency text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
  order_id uuid;
begin
  if not public.is_show_up_enabled() then
    raise exception 'show up is disabled';
  end if;
  if not public.is_help_staff() then
    raise exception 'not authorized';
  end if;

  select recipient_user_id into recipient_id
  from public.human_needs
  where id = p_human_need_id
    and status in ('approved', 'partially_fulfilled')
    and verification_status <> 'unverified'
  for update;
  if not found then
    raise exception 'need is not fulfillable';
  end if;

  if not exists (
    select 1 from public.fulfillment_profiles
    where user_id = recipient_id and allow_tangible_help = true
  ) then
    raise exception 'recipient has not enabled tangible help';
  end if;
  if not exists (
    select 1
    from (
      select * from public.help_consent_records
      where user_id = recipient_id
      order by created_at desc, id desc
      limit 1
    ) latest
    where latest.revoked_at is null and latest.allow_help_requests = true
      and (p_provider in ('internal', 'partner') or latest.allow_fulfillment_provider = true)
      and (p_provider <> 'partner' or latest.allow_partner_contact = true)
  ) then
    raise exception 'current help consent is required';
  end if;
  if p_partner_id is not null and not exists (
    select 1 from public.help_partners
    where id = p_partner_id and status = 'active' and can_fulfill_needs = true
  ) then
    raise exception 'partner is not eligible to fulfill needs';
  end if;

  insert into public.fulfillment_orders (
    human_need_id, recipient_user_id, partner_id, provider,
    fulfillment_type, amount_cents, currency
  ) values (
    p_human_need_id, recipient_id, p_partner_id, p_provider,
    p_fulfillment_type, p_amount_cents, p_currency
  ) returning id into order_id;

  insert into public.sensitive_access_events (actor_user_id, resource_type, resource_id, action)
  values (auth.uid(), 'fulfillment_order', order_id, 'create_fulfillment_order');

  return order_id;
end;
$$;

revoke all on function public.is_show_up_enabled() from public;
revoke all on function public.audit_fulfillment_profile_change() from public, anon, authenticated;
revoke all on function public.is_help_staff() from public, anon;
revoke all on function public.is_help_partner_member(uuid) from public, anon;
revoke all on function public.owns_help_human_entry(uuid) from public, anon;
revoke all on function public.is_public_help_human_entry(uuid) from public;
revoke all on function public.my_human_needs() from public, anon;
revoke all on function public.get_fulfillment_profile_for_help(uuid) from public, anon;
revoke all on function public.get_private_human_need_for_help(uuid) from public, anon;
revoke all on function public.revoke_my_help_consent(uuid) from public, anon;
revoke all on function public.review_help_need(uuid, public.help_need_status, public.help_verification_status, boolean) from public, anon;
revoke all on function public.assign_help_partner(uuid, uuid, text) from public, anon;
revoke all on function public.create_help_fulfillment_order(uuid, uuid, text, public.help_fulfillment_type, bigint, text) from public, anon;
grant execute on function public.is_show_up_enabled() to anon, authenticated;
grant execute on function public.is_help_staff() to authenticated;
grant execute on function public.is_help_partner_member(uuid) to authenticated;
grant execute on function public.owns_help_human_entry(uuid) to authenticated;
grant execute on function public.is_public_help_human_entry(uuid) to anon, authenticated;
grant execute on function public.my_human_needs() to authenticated;
grant execute on function public.get_fulfillment_profile_for_help(uuid) to authenticated;
grant execute on function public.get_private_human_need_for_help(uuid) to authenticated;
grant execute on function public.revoke_my_help_consent(uuid) to authenticated;
grant execute on function public.review_help_need(uuid, public.help_need_status, public.help_verification_status, boolean) to authenticated;
grant execute on function public.assign_help_partner(uuid, uuid, text) to authenticated;
grant execute on function public.create_help_fulfillment_order(uuid, uuid, text, public.help_fulfillment_type, bigint, text) to authenticated;

alter table public.help_feature_flags enable row level security;
alter table public.help_staff_memberships enable row level security;
alter table public.help_partners enable row level security;
alter table public.help_partner_memberships enable row level security;
alter table public.fulfillment_profiles enable row level security;
alter table public.help_consent_records enable row level security;
alter table public.human_needs enable row level security;
alter table public.human_need_partner_assignments enable row level security;
alter table public.fulfillment_orders enable row level security;
alter table public.sensitive_access_events enable row level security;

create policy help_staff_memberships_admin_read on public.help_staff_memberships for select to authenticated
  using (public.is_staff(array['admin']::public.account_role[]));
create policy help_partners_public_read on public.help_partners for select to anon, authenticated
  using (public.is_show_up_enabled() and status = 'active');
create policy help_partner_memberships_read_self on public.help_partner_memberships for select to authenticated
  using (user_id = auth.uid());

create policy fulfillment_profiles_read_own on public.fulfillment_profiles for select to authenticated
  using (user_id = auth.uid());
create policy fulfillment_profiles_insert_own on public.fulfillment_profiles for insert to authenticated
  with check (
    public.is_show_up_enabled()
    and user_id = auth.uid() and verified_at is null and verified_by is null
    and (
      (not allow_tangible_help and not allow_partner_referral)
      or exists (
        select 1 from (
          select * from public.help_consent_records
          where user_id = auth.uid()
          order by created_at desc, id desc limit 1
        ) latest
        where latest.revoked_at is null
          and (not allow_tangible_help or latest.allow_help_requests = true)
          and (not allow_partner_referral or latest.allow_partner_contact = true)
      )
    )
  );
create policy fulfillment_profiles_update_own on public.fulfillment_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (
    public.is_show_up_enabled()
    and user_id = auth.uid()
    and (
      (not allow_tangible_help and not allow_partner_referral)
      or exists (
        select 1 from (
          select * from public.help_consent_records
          where user_id = auth.uid()
          order by created_at desc, id desc limit 1
        ) latest
        where latest.revoked_at is null
          and (not allow_tangible_help or latest.allow_help_requests = true)
          and (not allow_partner_referral or latest.allow_partner_contact = true)
      )
    )
  );
create policy fulfillment_profiles_delete_own on public.fulfillment_profiles for delete to authenticated
  using (user_id = auth.uid());

create policy help_consent_read_own on public.help_consent_records for select to authenticated
  using (user_id = auth.uid());
create policy help_consent_insert_own on public.help_consent_records for insert to authenticated
  with check (public.is_show_up_enabled() and user_id = auth.uid() and revoked_at is null);

create policy human_needs_public_read on public.human_needs for select to anon, authenticated
  using (
    public.is_show_up_enabled()
    and publicly_visible = true
    and verification_status <> 'unverified'
    and status in ('approved', 'partially_fulfilled', 'fulfilled')
    and public.is_public_help_human_entry(human_entry_id)
  );
create policy human_needs_read_own on public.human_needs for select to authenticated
  using (recipient_user_id = auth.uid());
create policy human_needs_partner_read_assigned on public.human_needs for select to authenticated
  using (
    public.is_show_up_enabled()
    and exists (
      select 1 from public.human_need_partner_assignments a
      where a.human_need_id = id
        and a.status in ('accepted', 'in_progress', 'completed')
        and public.is_help_partner_member(a.partner_id)
    )
  );
create policy human_needs_insert_own_draft on public.human_needs for insert to authenticated
  with check (
    public.is_show_up_enabled()
    and recipient_user_id = auth.uid()
    and status = 'draft'
    and verification_status = 'unverified'
    and publicly_visible = false
    and partner_id is null
    and public.owns_help_human_entry(human_entry_id)
  );
create policy human_needs_update_own_unapproved on public.human_needs for update to authenticated
  using (recipient_user_id = auth.uid() and status in ('draft', 'submitted'))
  with check (
    public.is_show_up_enabled()
    and recipient_user_id = auth.uid()
    and status in ('draft', 'submitted')
    and verification_status = 'unverified'
    and publicly_visible = false
    and partner_id is null
  );

create policy help_assignments_partner_read on public.human_need_partner_assignments for select to authenticated
  using (public.is_show_up_enabled() and public.is_help_partner_member(partner_id));

revoke all on public.help_feature_flags from anon, authenticated;
revoke all on public.help_staff_memberships from anon, authenticated;
revoke all on public.help_partners from anon, authenticated;
revoke all on public.help_partner_memberships from anon, authenticated;
revoke all on public.fulfillment_profiles from anon, authenticated;
revoke all on public.help_consent_records from anon, authenticated;
revoke all on public.human_needs from anon, authenticated;
revoke all on public.human_need_partner_assignments from anon, authenticated;
revoke all on public.fulfillment_orders from anon, authenticated;
revoke all on public.sensitive_access_events from anon, authenticated;

grant select on public.help_staff_memberships to authenticated;
grant select (
  id, name, slug, partner_type, city, state, country, public_contact_name,
  public_website, status, can_verify_needs, can_receive_deliveries,
  can_fulfill_needs, created_at, updated_at
) on public.help_partners to anon, authenticated;
grant select (id, partner_id, user_id, role, active, created_at, updated_at)
  on public.help_partner_memberships to authenticated;
grant select on public.fulfillment_profiles to authenticated;
grant insert (
  user_id, legal_delivery_name, phone, address_line_1, address_line_2, city, state,
  postal_code, country, delivery_notes, preferred_delivery_method,
  preferred_delivery_mode, allow_tangible_help, allow_partner_referral
) on public.fulfillment_profiles to authenticated;
grant update (
  legal_delivery_name, phone, address_line_1, address_line_2, city, state,
  postal_code, country, delivery_notes, preferred_delivery_method,
  preferred_delivery_mode, allow_tangible_help, allow_partner_referral
) on public.fulfillment_profiles to authenticated;
grant delete on public.fulfillment_profiles to authenticated;
grant select on public.help_consent_records to authenticated;
grant insert (
  user_id, allow_help_requests, allow_partner_contact, allow_delivery,
  allow_fulfillment_provider
) on public.help_consent_records to authenticated;
grant select (
  id, human_entry_id, need_type, public_title, public_description,
  quantity_needed, quantity_fulfilled, status, verification_status,
  publicly_visible, created_at, updated_at, fulfilled_at
) on public.human_needs to anon, authenticated;
grant insert (
  human_entry_id, recipient_user_id, need_type, public_title, public_description,
  private_notes, quantity_needed, delivery_mode
) on public.human_needs to authenticated;
grant update (
  need_type, public_title, public_description, private_notes, quantity_needed,
  delivery_mode, status
) on public.human_needs to authenticated;
grant select (id, human_need_id, partner_id, status, assigned_at, accepted_at, completed_at, updated_at)
  on public.human_need_partner_assignments to authenticated;

create or replace view public.human_needs_public
with (security_invoker = true)
as
select
  id,
  human_entry_id,
  need_type,
  public_title,
  public_description,
  quantity_needed,
  quantity_fulfilled,
  case
    when status = 'fulfilled' then 'fulfilled'
    when status = 'partially_fulfilled' or quantity_fulfilled > 0 then 'in_progress'
    else 'needed'
  end as public_status,
  created_at,
  updated_at,
  fulfilled_at
from public.human_needs
where public.is_show_up_enabled()
  and publicly_visible = true
  and verification_status <> 'unverified'
  and status in ('approved', 'partially_fulfilled', 'fulfilled')
  and public.is_public_help_human_entry(human_entry_id);

create or replace view public.help_partners_public
with (security_invoker = true)
as
select
  id, name, slug, partner_type, city, state, country, public_contact_name,
  public_website, can_verify_needs, can_receive_deliveries, can_fulfill_needs
from public.help_partners
where public.is_show_up_enabled() and status = 'active';

grant select on public.human_needs_public to anon, authenticated;
grant select on public.help_partners_public to anon, authenticated;

comment on table public.fulfillment_profiles is 'Highly private delivery identity. Never join into public HumanEntry projections; staff reads must use the audited get_fulfillment_profile_for_help function.';
comment on table public.human_needs is 'Controlled tangible-help workflow. Public consumers must use human_needs_public and never receive recipient_user_id or private_notes.';
comment on table public.fulfillment_orders is 'Provider-agnostic fulfillment metadata. Recipient addresses are intentionally not duplicated here.';
comment on table public.sensitive_access_events is 'Append-only sensitive access metadata. Never log profile values, notes, contact details, or addresses.';
comment on view public.human_needs_public is 'Public-safe tangible-help projection. Contains no recipient identity, delivery data, private notes, partner internals, or provider metadata.';
comment on view public.help_partners_public is 'Public partner projection. Internal contacts and membership data are excluded.';

commit;
