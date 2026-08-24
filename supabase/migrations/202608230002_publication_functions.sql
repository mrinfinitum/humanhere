begin;

create or replace function public.publish_submission(
  p_submission_id uuid,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_type public.human_entry_type default 'story',
  p_layout jsonb default null,
  p_sensitive_story boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission public.submissions%rowtype;
  consent public.consent_records%rowtype;
  entry_id uuid;
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

  select * into submission from public.submissions where id = p_submission_id for update;
  if not found or submission.status <> 'approved' then
    raise exception 'submission is not publishable';
  end if;

  select * into consent from public.consent_records
  where submission_id = p_submission_id
  order by created_at desc, id desc limit 1;
  if not found or consent.revoked_at is not null or consent.verified_at is null
     or consent.verified_by is null or not consent.publish_story then
    raise exception 'verified story consent is required';
  end if;
  if (p_thumbnail is not null or (p_media is not null and jsonb_array_length(p_media) > 0))
     and not consent.publish_media then
    raise exception 'verified media consent is required';
  end if;
  if submission.media_withheld and (p_thumbnail is not null or (p_media is not null and jsonb_array_length(p_media) > 0)) then
    raise exception 'media is withheld for this submission';
  end if;
  if submission.is_minor and not submission.guardian_consent_verified then
    raise exception 'verified guardian consent is required';
  end if;
  if submission.requested_publish_after is not null and submission.requested_publish_after > now() then
    raise exception 'delayed publication date has not been reached';
  end if;
  if not (submission.anonymous or submission.identity_mode = 'anonymous')
     and nullif(btrim(coalesce(submission.public_name, '')), '') is null then
    raise exception 'a public first name or anonymous identity is required';
  end if;
  if nullif(btrim(coalesce(submission.story, '')), '') is null
     and nullif(btrim(coalesce(submission.headline, '')), '') is null
     and p_thumbnail is null
     and (p_media is null or jsonb_array_length(p_media) = 0) then
    raise exception 'public content is required';
  end if;

  insert into public.human_entries (
    slug, type, source, public_name, first_name, display_location, anonymous,
    thumbnail, media, headline, story, layout, submission_id, subject_user_id,
    consent_verified, is_minor, guardian_consent_verified, sensitive_story,
    location_withheld, media_withheld, publish_after, allow_private_notes,
    social_image_allowed, published, published_at
  ) values (
    p_slug, p_type, 'direct',
    case when submission.anonymous or submission.identity_mode = 'anonymous' then 'ANONYMOUS' else split_part(btrim(submission.public_name), ' ', 1) end,
    case when submission.anonymous or submission.identity_mode = 'anonymous' then null else split_part(btrim(submission.public_name), ' ', 1) end,
    case when submission.location_withheld then null else submission.location end,
    (submission.anonymous or submission.identity_mode = 'anonymous'), case when submission.media_withheld then null else p_thumbnail end,
    case when submission.media_withheld then null else p_media end,
    submission.headline, submission.story, p_layout, submission.id, submission.user_id,
    true, submission.is_minor, submission.guardian_consent_verified, p_sensitive_story,
    submission.location_withheld, submission.media_withheld, submission.requested_publish_after,
    case when submission.is_minor or p_sensitive_story then false else submission.allow_private_notes end,
    consent.social_reuse and consent.publish_media and not submission.media_withheld, true, now()
  ) returning id into entry_id;

  update public.submissions set status = 'published' where id = submission.id;
  return entry_id;
end;
$$;

create or replace function public.revoke_owned_submission_consent(p_submission_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_slugs text[];
begin
  if not exists (select 1 from public.submissions where id = p_submission_id and user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update public.consent_records
  set revoked_at = now(), updated_at = now()
  where submission_id = p_submission_id and user_id = auth.uid() and revoked_at is null;

  select coalesce(array_agg(slug), array[]::text[]) into affected_slugs
  from public.human_entries where submission_id = p_submission_id and published = true;

  update public.human_entries
  set published = false, consent_verified = false
  where submission_id = p_submission_id and published = true;

  update public.submissions
  set status = 'archived'
  where id = p_submission_id and status = 'published';

  return affected_slugs;
end;
$$;

create or replace function public.unpublish_human_entry(p_human_entry_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_slug text;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;

  update public.human_entries
  set published = false
  where id = p_human_entry_id and published = true
  returning slug into affected_slug;

  if affected_slug is null then
    raise exception 'published entry not found';
  end if;

  return affected_slug;
end;
$$;

revoke all on function public.publish_submission(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb, boolean) from public, anon;
revoke all on function public.revoke_owned_submission_consent(uuid) from public, anon;
revoke all on function public.unpublish_human_entry(uuid) from public, anon;
grant execute on function public.publish_submission(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb, boolean) to authenticated;
grant execute on function public.revoke_owned_submission_consent(uuid) to authenticated;
grant execute on function public.unpublish_human_entry(uuid) to authenticated;

commit;
