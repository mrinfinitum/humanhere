begin;

insert into public.profiles (id, display_name) values
  ('81000000-0000-4000-8000-000000000001', 'Owner'),
  ('81000000-0000-4000-8000-000000000002', 'Other');
insert into public.submissions (id, user_id, story, status, submitted_at) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'Published story', 'published', now()),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 'Story to delete', 'published', now());
insert into public.consent_records (submission_id, user_id, publish_story, verified_at, verified_by) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', true, now(), '81000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', true, now(), '81000000-0000-4000-8000-000000000001');
insert into public.submission_media (submission_id, media_type, storage_path, mime_type, byte_size)
values ('82000000-0000-4000-8000-000000000002', 'image',
  '81000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000002/84000000-0000-4000-8000-000000000001.jpg', 'image/jpeg', 100);
insert into public.human_entries (slug, type, source, first_name, submission_id, subject_user_id, consent_verified, published, published_at, thumbnail) values
  ('owner-edit-test-human', 'story', 'direct', 'Owner', '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001', true, true, now(), null),
  ('owner-delete-test-human', 'story', 'direct', 'Owner', '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000001', true, true, now(),
    '{"id":"t","provider":"neon","path":"82000000-0000-4000-8000-000000000002/public.jpg","alt":"","mimeType":"image/jpeg","kind":"image"}');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '81000000-0000-4000-8000-000000000002')::text, true);
do $$
begin
  begin
    perform public.withdraw_owned_submission('82000000-0000-4000-8000-000000000001');
    raise exception 'RLS FAILURE: another user withdrew a story';
  exception when raise_exception then
    if sqlerrm <> 'not authorized' then raise; end if;
  end;
  begin
    perform public.delete_owned_submission('82000000-0000-4000-8000-000000000002');
    raise exception 'RLS FAILURE: another user deleted a story';
  exception when raise_exception then
    if sqlerrm <> 'not authorized' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claims', json_build_object('sub', '81000000-0000-4000-8000-000000000001')::text, true);
do $$
declare
  slugs text[];
  removed jsonb;
begin
  slugs := public.withdraw_owned_submission('82000000-0000-4000-8000-000000000001');
  if slugs <> array['owner-edit-test-human'] then raise exception 'Withdrawal did not return the published slug'; end if;
  if exists (select 1 from public.human_entries_public where slug = 'owner-edit-test-human') then
    raise exception 'Withdrawn story is still public';
  end if;
  if (select status from public.submissions where id = '82000000-0000-4000-8000-000000000001') <> 'draft' then
    raise exception 'Withdrawn story is not a draft';
  end if;
  update public.submissions set story = 'Edited story' where id = '82000000-0000-4000-8000-000000000001';
  if not found then raise exception 'Owner could not edit the withdrawn story'; end if;

  removed := public.delete_owned_submission('82000000-0000-4000-8000-000000000002');
  if removed->'slugs' <> '["owner-delete-test-human"]'::jsonb then raise exception 'Deletion did not return the published slug'; end if;
  if jsonb_array_length(removed->'private_paths') <> 1 then raise exception 'Deletion did not return the private file'; end if;
  if removed->'public_assets'->0->>'path' <> '82000000-0000-4000-8000-000000000002/public.jpg' then
    raise exception 'Deletion did not return the public file';
  end if;
  if exists (select 1 from public.submissions where id = '82000000-0000-4000-8000-000000000002') then
    raise exception 'Deleted story still exists';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.consent_archive) then
    raise exception 'RLS FAILURE: a member read the consent archive';
  end if;
  if public.accept_terms('2026-10-06') is null then raise exception 'Terms acceptance was not recorded'; end if;
  begin
    perform public.accept_terms('latest');
    raise exception 'An invalid terms version was accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid terms version' then raise; end if;
  end;
  begin
    update public.profiles set terms_version = '2099-01-01' where id = auth.user_id()::uuid;
    raise exception 'A member wrote their own terms version';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
do $$
begin
  if exists (select 1 from public.consent_records where submission_id = '82000000-0000-4000-8000-000000000001' and revoked_at is null) then
    raise exception 'Withdrawal left consent in force';
  end if;
  if exists (select 1 from public.human_entries where slug = 'owner-delete-test-human') then
    raise exception 'Deleted story left a public entry';
  end if;
  if exists (select 1 from public.submission_media where submission_id = '82000000-0000-4000-8000-000000000002') then
    raise exception 'Deleted story left media rows';
  end if;
  if (select count(*) from public.consent_archive
      where submission_id = '82000000-0000-4000-8000-000000000002' and was_published and revoked_at is not null) <> 1 then
    raise exception 'Deleted story did not keep its consent record';
  end if;
  if (select terms_version from public.profiles where id = '81000000-0000-4000-8000-000000000001') <> '2026-10-06' then
    raise exception 'Terms version was not stored';
  end if;
end;
$$;

rollback;
