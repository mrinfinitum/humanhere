begin;

create or replace function public.publish_submission(
  p_submission_id uuid,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_type public.human_entry_type default 'story',
  p_layout jsonb default null
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

  select * into submission from public.submissions where id = p_submission_id for update;
  if not found or submission.status not in ('approved', 'in_review', 'contacted') then
    raise exception 'submission is not publishable';
  end if;

  select * into consent from public.consent_records
  where submission_id = p_submission_id and revoked_at is null
  order by created_at desc, id desc limit 1;
  if not found or consent.verified_at is null or not consent.publish_story then
    raise exception 'verified story consent is required';
  end if;
  if p_media is not null and not consent.publish_media then
    raise exception 'verified media consent is required';
  end if;

  insert into public.human_entries (
    slug, type, source, public_name, first_name, display_location, anonymous,
    thumbnail, media, headline, story, layout, submission_id, consent_verified,
    published, published_at
  ) values (
    p_slug, p_type, 'direct',
    case when submission.anonymous then 'ANONYMOUS' else submission.public_name end,
    case when submission.identity_mode = 'first_name' then split_part(submission.public_name, ' ', 1) else null end,
    submission.location, submission.anonymous, p_thumbnail, p_media, submission.headline,
    submission.story, p_layout, submission.id, true, true, now()
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

  return affected_slugs;
end;
$$;

revoke all on function public.publish_submission(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb) from public;
revoke all on function public.revoke_owned_submission_consent(uuid) from public;
grant execute on function public.publish_submission(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb) to authenticated;
grant execute on function public.revoke_owned_submission_consent(uuid) to authenticated;

commit;
