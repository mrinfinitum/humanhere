begin;

create table public.social_creator_consent_tokens (
  id uuid primary key default gen_random_uuid(),
  social_discovery_post_id uuid not null references public.social_discovery_posts(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.social_creator_consent_records (
  id uuid primary key default gen_random_uuid(),
  social_discovery_post_id uuid not null references public.social_discovery_posts(id) on delete cascade,
  publish_story boolean not null default false,
  publish_media boolean not null default false,
  social_reuse boolean not null default false,
  creator_name text,
  creator_email text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index social_consent_token_expiry_idx on public.social_creator_consent_tokens (expires_at) where used_at is null;
create index social_creator_consent_post_idx on public.social_creator_consent_records (social_discovery_post_id, created_at desc);

alter table public.social_creator_consent_tokens enable row level security;
alter table public.social_creator_consent_records enable row level security;
create policy social_consent_tokens_staff on public.social_creator_consent_tokens for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy social_consent_records_staff on public.social_creator_consent_records for all to authenticated using (public.is_staff()) with check (public.is_staff());

comment on column public.social_creator_consent_tokens.token_hash is 'SHA-256 digest only. Raw high-entropy tokens are never stored.';

commit;
