begin;

-- Revocation must serialize with publish_submission, which locks the same
-- submission row. Without the lock, a revoke committing while a publication is
-- in flight skips the not-yet-published row and the story goes live anyway.
create or replace function public.revoke_owned_submission_consent(p_submission_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_slugs text[];
begin
  perform 1 from public.submissions
  where id = p_submission_id and user_id = auth.user_id()::uuid
  for update;
  if not found then
    raise exception 'not authorized';
  end if;

  update public.consent_records
  set revoked_at = now(), updated_at = now()
  where submission_id = p_submission_id and user_id = auth.user_id()::uuid and revoked_at is null;

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

-- Owners register uploads only through the server, which writes these columns
-- from verified object metadata. Descriptive fields that flow into public
-- assets (dimensions, blur placeholders) are left to staff.
revoke insert on public.submission_media from authenticated;
grant insert (submission_id, media_type, storage_provider, storage_path, mime_type, byte_size)
  on public.submission_media to authenticated;

commit;
