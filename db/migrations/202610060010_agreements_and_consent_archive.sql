begin;

-- Members agree to the terms once per published version. The date and version
-- are written only through accept_terms(), never by a direct profile update.
alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text;

create or replace function public.accept_terms(p_version text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted timestamptz;
begin
  if auth.user_id()::uuid is null then
    raise exception 'authentication required';
  end if;
  if p_version is null or p_version !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid terms version';
  end if;

  update public.profiles
  set terms_accepted_at = now(), terms_version = p_version
  where id = auth.user_id()::uuid and terms_version is distinct from p_version;

  select terms_accepted_at into accepted from public.profiles where id = auth.user_id()::uuid;
  return accepted;
end;
$$;
revoke all on function public.accept_terms(text) from public, anonymous;
grant execute on function public.accept_terms(text) to authenticated;

-- Each consent record names the wording the member agreed to.
alter table public.consent_records add column consent_version text;
grant insert (consent_version) on public.consent_records to authenticated;

-- Deleting a story erases its content, files, and live consent rows. This
-- staff-only archive keeps the minimum needed to show that a story which may
-- have been public was published with permission: who, when, and which choices.
create table public.consent_archive (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  publish_story boolean not null,
  publish_media boolean not null,
  social_reuse boolean not null,
  may_contact boolean not null,
  partner_referral boolean not null,
  consent_version text,
  consented_at timestamptz not null,
  revoked_at timestamptz,
  verified_at timestamptz,
  was_published boolean not null,
  deleted_at timestamptz not null default now()
);
create index consent_archive_user_idx on public.consent_archive (user_id, deleted_at desc);
create index consent_archive_submission_idx on public.consent_archive (submission_id);

alter table public.consent_archive enable row level security;
create policy consent_archive_staff_read on public.consent_archive for select to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]));
revoke all on public.consent_archive from anonymous, authenticated;
grant select on public.consent_archive to authenticated;

create or replace function public.delete_owned_submission(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed jsonb;
begin
  perform 1 from public.submissions
  where id = p_submission_id and user_id = auth.user_id()::uuid
  for update;
  if not found then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'slugs', coalesce((
      select jsonb_agg(slug) from public.human_entries
      where submission_id = p_submission_id and published = true
    ), '[]'::jsonb),
    'private_paths', coalesce((
      select jsonb_agg(storage_path) from public.submission_media
      where submission_id = p_submission_id
    ), '[]'::jsonb),
    'public_assets', coalesce((
      select jsonb_agg(asset) from (
        select thumbnail as asset from public.human_entries
        where submission_id = p_submission_id and thumbnail is not null
        union all
        select jsonb_array_elements(media) from public.human_entries
        where submission_id = p_submission_id and jsonb_typeof(media) = 'array'
      ) assets
    ), '[]'::jsonb)
  ) into removed;

  insert into public.consent_archive (
    submission_id, user_id, publish_story, publish_media, social_reuse, may_contact,
    partner_referral, consent_version, consented_at, revoked_at, verified_at, was_published
  )
  select c.submission_id, c.user_id, c.publish_story, c.publish_media, c.social_reuse, c.may_contact,
    c.partner_referral, c.consent_version, c.consented_at, coalesce(c.revoked_at, now()), c.verified_at,
    exists (select 1 from public.human_entries h where h.submission_id = p_submission_id)
  from public.consent_records c
  where c.submission_id = p_submission_id;

  delete from public.human_entries where submission_id = p_submission_id;
  delete from public.submissions where id = p_submission_id;

  return removed;
end;
$$;

commit;
