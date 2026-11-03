begin;

-- Stories publish as soon as their author submits them, like a social post.
-- Staff only see a story when the automatic check holds it (it looks like it
-- contains a phone number, email or street address) or when someone reports it.
--
-- Both functions are called only by the server, which has already checked the
-- signed-in member and run the check; no role may call them directly.

-- Publishes a member's own submitted story. Consent is the member's own: they
-- confirmed it when submitting, so the record is marked verified by them.
create function public.self_publish_submission(
  p_user_id uuid,
  p_submission_id uuid,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_public_latitude numeric default null,
  p_public_longitude numeric default null,
  p_public_location_precision public.human_public_location_precision default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission public.submissions%rowtype;
  consent public.consent_records%rowtype;
  entry public.human_entries%rowtype;
  is_anonymous boolean;
  public_first text;
  has_media boolean := p_thumbnail is not null or (p_media is not null and jsonb_array_length(p_media) > 0);
begin
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid public slug';
  end if;
  if p_thumbnail is not null and not (
    jsonb_typeof(p_thumbnail) = 'object' and p_thumbnail ?& array['id', 'provider', 'path', 'alt', 'mimeType', 'kind']
  ) then
    raise exception 'invalid thumbnail';
  end if;
  if p_media is not null and jsonb_typeof(p_media) <> 'array' then
    raise exception 'invalid media';
  end if;

  select * into submission from public.submissions
  where id = p_submission_id and user_id = p_user_id for update;
  if not found or submission.status <> 'submitted' then
    raise exception 'submission is not publishable';
  end if;

  select * into consent from public.consent_records
  where submission_id = p_submission_id
  order by created_at desc, id desc limit 1 for update;
  if not found or consent.revoked_at is not null or not consent.publish_story then
    raise exception 'story consent is required';
  end if;
  if has_media and (not consent.publish_media or submission.media_withheld) then
    raise exception 'media cannot be published';
  end if;
  -- A story about a minor still needs a guardian's consent checked by staff.
  if submission.is_minor and not submission.guardian_consent_verified then
    raise exception 'verified guardian consent is required';
  end if;
  if submission.requested_publish_after is not null and submission.requested_publish_after > now() then
    raise exception 'delayed publication date has not been reached';
  end if;
  is_anonymous := coalesce(submission.anonymous, false) or coalesce(submission.identity_mode = 'anonymous', false);
  public_first := nullif(split_part(btrim(coalesce(submission.public_name, '')), ' ', 1), '');
  if not is_anonymous and public_first is null then
    raise exception 'a public first name or anonymous identity is required';
  end if;
  if nullif(btrim(coalesce(submission.story, '')), '') is null
     and nullif(btrim(coalesce(submission.headline, '')), '') is null and not has_media then
    raise exception 'public content is required';
  end if;
  if (p_public_latitude is null) <> (p_public_longitude is null) or (p_public_latitude is null) <> (p_public_location_precision is null) then
    raise exception 'public latitude, longitude, and precision are all required';
  end if;

  update public.consent_records
  set verified_at = coalesce(verified_at, now()), verified_by = coalesce(verified_by, p_user_id), updated_at = now()
  where id = consent.id;

  -- An edited story returns to its existing entry, so its link, loves and notes stay.
  select * into entry from public.human_entries where submission_id = submission.id for update;
  if found then
    update public.human_entries set
      public_name = case when is_anonymous then 'ANONYMOUS' else public_first end,
      first_name = case when is_anonymous then null else public_first end,
      display_location = case when submission.location_withheld then null else submission.location end,
      anonymous = is_anonymous,
      thumbnail = case when submission.media_withheld then null else p_thumbnail end,
      media = case when submission.media_withheld then null else p_media end,
      headline = submission.headline, story = submission.story,
      consent_verified = true, location_withheld = submission.location_withheld, media_withheld = submission.media_withheld,
      allow_private_notes = case when submission.is_minor then false else submission.allow_private_notes end,
      social_image_allowed = consent.social_reuse and consent.publish_media and not submission.media_withheld,
      public_latitude = null, public_longitude = null, public_location_precision = null,
      public_location_approved_at = null, public_location_approved_by = null,
      published = true, published_at = now()
    where id = entry.id
    returning * into entry;
  else
    insert into public.human_entries (
      slug, type, source, public_name, first_name, display_location, anonymous,
      thumbnail, media, headline, story, layout, submission_id, subject_user_id,
      consent_verified, is_minor, guardian_consent_verified, sensitive_story,
      location_withheld, media_withheld, publish_after, allow_private_notes,
      social_image_allowed, published, published_at
    ) values (
      p_slug, 'story', 'direct',
      case when is_anonymous then 'ANONYMOUS' else public_first end,
      case when is_anonymous then null else public_first end,
      case when submission.location_withheld then null else submission.location end,
      is_anonymous, case when submission.media_withheld then null else p_thumbnail end,
      case when submission.media_withheld then null else p_media end,
      submission.headline, submission.story, '{"size": "md"}'::jsonb, submission.id, submission.user_id,
      true, submission.is_minor, submission.guardian_consent_verified, false,
      submission.location_withheld, submission.media_withheld, submission.requested_publish_after,
      case when submission.is_minor then false else submission.allow_private_notes end,
      consent.social_reuse and consent.publish_media and not submission.media_withheld, true, now()
    ) returning * into entry;
  end if;

  -- Only an approximate centroid the server matched from the typed place, never a precise spot.
  if p_public_latitude is not null and not entry.location_withheld
     and nullif(btrim(coalesce(entry.display_location, '')), '') is not null then
    update public.human_entries
    set public_latitude = p_public_latitude, public_longitude = p_public_longitude,
        public_location_precision = p_public_location_precision,
        public_location_approved_at = now(), public_location_approved_by = p_user_id
    where id = entry.id;
  end if;

  update public.submissions set status = 'published' where id = submission.id;
  return entry.slug;
end;
$$;
revoke all on function public.self_publish_submission(uuid, uuid, text, jsonb, jsonb, numeric, numeric, public.human_public_location_precision) from public, anonymous, authenticated;

-- Holds a member's own submitted story for staff, with the reason the check found.
create function public.hold_submission_for_review(p_user_id uuid, p_submission_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.submissions set status = 'in_review'
  where id = p_submission_id and user_id = p_user_id and status = 'submitted';
  if not found then
    raise exception 'submission is not holdable';
  end if;
  insert into public.moderation_flags (submission_id, flag, tier, notes, created_by)
  values (p_submission_id, 'visible_private_information', 'YELLOW', left(p_reason, 500), p_user_id);
end;
$$;
revoke all on function public.hold_submission_for_review(uuid, uuid, text) from public, anonymous, authenticated;

commit;
