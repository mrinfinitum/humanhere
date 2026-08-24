begin;

create table public.social_creator_consent_tokens (
  id uuid primary key default gen_random_uuid(),
  social_discovery_post_id uuid not null references public.social_discovery_posts(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint social_consent_token_expiry_valid check (expires_at > created_at),
  constraint social_consent_token_used_valid check (used_at is null or used_at >= created_at),
  constraint social_consent_token_revoked_valid check (revoked_at is null or revoked_at >= created_at)
);

create table public.social_creator_consent_records (
  id uuid primary key default gen_random_uuid(),
  social_discovery_post_id uuid not null references public.social_discovery_posts(id) on delete cascade,
  token_id uuid not null unique references public.social_creator_consent_tokens(id) on delete restrict,
  publish_story boolean not null default false,
  publish_media boolean not null default false,
  social_reuse boolean not null default false,
  creator_name text check (creator_name is null or length(creator_name) <= 160),
  creator_email text not null check (length(creator_email) <= 320),
  consented_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index social_consent_token_expiry_idx on public.social_creator_consent_tokens (expires_at)
  where used_at is null and revoked_at is null;
create index social_creator_consent_post_idx on public.social_creator_consent_records
  (social_discovery_post_id, created_at desc, id desc);

alter table public.social_creator_consent_tokens enable row level security;
alter table public.social_creator_consent_records enable row level security;

create policy social_consent_tokens_staff_read on public.social_creator_consent_tokens
  for select to authenticated using (public.is_staff(array['editor', 'admin']::public.account_role[]));
create policy social_consent_tokens_admin_delete on public.social_creator_consent_tokens
  for delete to authenticated using (public.is_staff(array['admin']::public.account_role[]));
create policy social_consent_records_staff_read on public.social_creator_consent_records
  for select to authenticated using (public.is_staff());
create policy social_consent_records_editor_manage on public.social_creator_consent_records
  for all to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));

revoke all on public.social_creator_consent_tokens from anon, authenticated;
revoke all on public.social_creator_consent_records from anon, authenticated;
grant select on public.social_creator_consent_records to authenticated;

create or replace function public.issue_social_creator_consent_token(
  p_social_discovery_post_id uuid,
  p_expires_in interval default interval '7 days'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;
  if p_expires_in is null or p_expires_in < interval '15 minutes' or p_expires_in > interval '30 days' then
    raise exception 'invalid token lifetime';
  end if;
  if not exists (
    select 1 from public.social_discovery_posts
    where id = p_social_discovery_post_id
      and moderation_status = 'approved_for_contact'
      and consent_status in ('not_requested', 'requested')
  ) then
    raise exception 'social discovery record is not eligible for consent';
  end if;

  update public.social_creator_consent_tokens
  set revoked_at = now()
  where social_discovery_post_id = p_social_discovery_post_id
    and used_at is null and revoked_at is null;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.social_creator_consent_tokens (
    social_discovery_post_id, token_hash, expires_at, created_by
  ) values (
    p_social_discovery_post_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    now() + p_expires_in,
    auth.uid()
  );

  update public.social_discovery_posts
  set consent_status = 'requested'
  where id = p_social_discovery_post_id;

  return raw_token;
end;
$$;

create or replace function public.accept_social_creator_consent(
  p_token text,
  p_publish_story boolean,
  p_publish_media boolean,
  p_social_reuse boolean,
  p_creator_name text,
  p_creator_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  consent_token public.social_creator_consent_tokens%rowtype;
  consent_id uuid;
begin
  if p_token is null or length(p_token) <> 64 or p_token !~ '^[0-9a-f]+$' then
    raise exception 'invalid or expired consent token';
  end if;
  if not p_publish_story then
    raise exception 'story publication consent is required';
  end if;
  if nullif(btrim(coalesce(p_creator_email, '')), '') is null or length(p_creator_email) > 320
     or p_creator_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid creator contact is required';
  end if;

  select * into consent_token
  from public.social_creator_consent_tokens
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found or consent_token.used_at is not null or consent_token.revoked_at is not null
     or consent_token.expires_at <= now() then
    raise exception 'invalid or expired consent token';
  end if;

  insert into public.social_creator_consent_records (
    social_discovery_post_id, token_id, publish_story, publish_media, social_reuse,
    creator_name, creator_email
  ) values (
    consent_token.social_discovery_post_id, consent_token.id, p_publish_story,
    p_publish_media, p_social_reuse, nullif(btrim(p_creator_name), ''), btrim(p_creator_email)
  ) returning id into consent_id;

  update public.social_creator_consent_tokens set used_at = now() where id = consent_token.id;
  update public.social_discovery_posts
  set consent_status = 'received'
  where id = consent_token.social_discovery_post_id;

  return consent_id;
end;
$$;

create or replace function public.publish_social_discovery(
  p_social_discovery_post_id uuid,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_type public.human_entry_type default 'story',
  p_headline text default null,
  p_quote text default null,
  p_story text default null,
  p_layout jsonb default null,
  p_location text default null,
  p_anonymous boolean default false,
  p_media_withheld boolean default false,
  p_location_withheld boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  discovery public.social_discovery_posts%rowtype;
  consent public.social_creator_consent_records%rowtype;
  entry_id uuid;
  safe_first_name text;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid public slug';
  end if;
  if p_thumbnail is not null and not (
    jsonb_typeof(p_thumbnail) = 'object'
    and p_thumbnail ?& array['id', 'provider', 'path', 'alt', 'mimeType', 'kind']
  ) then
    raise exception 'invalid thumbnail';
  end if;
  if p_media is not null and jsonb_typeof(p_media) <> 'array' then
    raise exception 'invalid media';
  end if;

  select * into discovery from public.social_discovery_posts
  where id = p_social_discovery_post_id for update;
  if not found or discovery.moderation_status <> 'approved_for_contact'
     or discovery.editorial_status <> 'approved' or discovery.consent_status <> 'received' then
    raise exception 'social discovery record is not publishable';
  end if;

  select * into consent from public.social_creator_consent_records
  where social_discovery_post_id = p_social_discovery_post_id
  order by created_at desc, id desc limit 1;
  if not found or consent.revoked_at is not null or consent.verified_at is null or not consent.publish_story then
    raise exception 'verified creator consent is required';
  end if;
  if (p_thumbnail is not null or (p_media is not null and jsonb_array_length(p_media) > 0))
     and not consent.publish_media then
    raise exception 'verified creator media consent is required';
  end if;
  if p_media_withheld and (p_thumbnail is not null or (p_media is not null and jsonb_array_length(p_media) > 0)) then
    raise exception 'media is withheld for this story';
  end if;
  if nullif(btrim(coalesce(p_story, '')), '') is null
     and nullif(btrim(coalesce(p_headline, '')), '') is null
     and p_thumbnail is null and (p_media is null or jsonb_array_length(p_media) = 0) then
    raise exception 'public content is required';
  end if;

  safe_first_name := case when p_anonymous then null else split_part(btrim(coalesce(consent.creator_name, '')), ' ', 1) end;
  if not p_anonymous and nullif(safe_first_name, '') is null then
    raise exception 'a public first name or anonymous identity is required';
  end if;

  insert into public.human_entries (
    slug, type, source, public_name, first_name, display_location, anonymous,
    thumbnail, media, headline, quote, story, layout, source_platform, source_url,
    social_discovery_post_id, consent_verified, location_withheld, media_withheld,
    social_image_allowed, published, published_at
  ) values (
    p_slug, p_type, 'social', case when p_anonymous then 'ANONYMOUS' else safe_first_name end,
    safe_first_name, case when p_location_withheld then null else p_location end, p_anonymous,
    case when p_media_withheld then null else p_thumbnail end,
    case when p_media_withheld then null else p_media end,
    p_headline, p_quote, p_story, p_layout, discovery.platform, discovery.source_url,
    discovery.id, true, p_location_withheld, p_media_withheld,
    consent.social_reuse and consent.publish_media and not p_media_withheld, true, now()
  ) returning id into entry_id;

  update public.social_discovery_posts
  set editorial_status = 'converted', linked_human_entry_id = entry_id
  where id = discovery.id;

  return entry_id;
end;
$$;

create or replace function public.revoke_social_creator_consent(p_social_discovery_post_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_slugs text[];
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;

  update public.social_creator_consent_records
  set revoked_at = now()
  where social_discovery_post_id = p_social_discovery_post_id and revoked_at is null;

  update public.social_creator_consent_tokens
  set revoked_at = now()
  where social_discovery_post_id = p_social_discovery_post_id
    and used_at is null and revoked_at is null;

  select coalesce(array_agg(slug), array[]::text[]) into affected_slugs
  from public.human_entries
  where social_discovery_post_id = p_social_discovery_post_id and published = true;

  update public.human_entries
  set published = false, consent_verified = false
  where social_discovery_post_id = p_social_discovery_post_id and published = true;

  update public.social_discovery_posts
  set consent_status = 'revoked'
  where id = p_social_discovery_post_id;

  return affected_slugs;
end;
$$;

revoke all on function public.issue_social_creator_consent_token(uuid, interval) from public, anon;
revoke all on function public.accept_social_creator_consent(text, boolean, boolean, boolean, text, text) from public;
revoke all on function public.publish_social_discovery(uuid, text, jsonb, jsonb, public.human_entry_type, text, text, text, jsonb, text, boolean, boolean, boolean) from public, anon;
revoke all on function public.revoke_social_creator_consent(uuid) from public, anon;
grant execute on function public.issue_social_creator_consent_token(uuid, interval) to authenticated;
grant execute on function public.accept_social_creator_consent(text, boolean, boolean, boolean, text, text) to anon, authenticated;
grant execute on function public.publish_social_discovery(uuid, text, jsonb, jsonb, public.human_entry_type, text, text, text, jsonb, text, boolean, boolean, boolean) to authenticated;
grant execute on function public.revoke_social_creator_consent(uuid) to authenticated;

comment on column public.social_creator_consent_tokens.token_hash is 'SHA-256 digest only. Raw 256-bit tokens are returned once and never stored.';
comment on table public.social_creator_consent_records is 'Private creator consent evidence. Never expose creator contact data through public projections.';

commit;
