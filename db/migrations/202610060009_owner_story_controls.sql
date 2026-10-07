begin;

-- Owners may pull any of their stories back to a private draft to edit it.
-- Consent is revoked and public entries are closed first, so an edited story
-- returns through review and fresh consent before it can be published again.
create or replace function public.withdraw_owned_submission(p_submission_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.submission_status;
  affected_slugs text[];
begin
  select status into current_status from public.submissions
  where id = p_submission_id and user_id = auth.user_id()::uuid
  for update;
  if not found then
    raise exception 'not authorized';
  end if;
  if current_status = 'draft' then
    return array[]::text[];
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
  set status = 'draft', submitted_at = null
  where id = p_submission_id;

  return affected_slugs;
end;
$$;

-- Owners may permanently delete a story in any state. The caller receives the
-- storage keys so the server can remove the private and public files.
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

  delete from public.human_entries where submission_id = p_submission_id;
  delete from public.submissions where id = p_submission_id;

  return removed;
end;
$$;

revoke all on function public.withdraw_owned_submission(uuid) from public, anonymous;
revoke all on function public.delete_owned_submission(uuid) from public, anonymous;
grant execute on function public.withdraw_owned_submission(uuid) to authenticated;
grant execute on function public.delete_owned_submission(uuid) to authenticated;

commit;
