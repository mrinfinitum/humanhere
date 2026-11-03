begin;

insert into public.profiles (id, display_name, username) values
  ('a4000000-0000-4000-8000-000000000001', 'Ivy Poster', 'ivy'),
  ('a4000000-0000-4000-8000-000000000002', 'Jon Other', 'jon');
insert into public.submissions (id, user_id, public_name, headline, story, location, status, submitted_at) values
  ('b4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Ivy Rose', 'Starting over', 'I moved here last spring.', 'Tulsa, Oklahoma', 'submitted', now()),
  ('b4000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000001', 'Ivy Rose', 'Call me', 'My number is in here.', null, 'submitted', now()),
  ('b4000000-0000-4000-8000-000000000003', 'a4000000-0000-4000-8000-000000000001', 'Ivy Rose', 'No consent', 'Story', null, 'submitted', now());
insert into public.consent_records (submission_id, user_id, publish_story, publish_media) values
  ('b4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', true, true),
  ('b4000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000001', true, true),
  ('b4000000-0000-4000-8000-000000000003', 'a4000000-0000-4000-8000-000000000001', false, false);

-- Members cannot call either function, even for their own stories.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a4000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  begin
    perform public.self_publish_submission('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'ivy-x', null);
    raise exception 'RLS FAILURE: a member called self_publish_submission';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.hold_submission_for_review('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002', 'x');
    raise exception 'RLS FAILURE: a member called hold_submission_for_review';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

do $$
declare
  published_slug text;
begin
  -- Someone else's story cannot be published under their id.
  begin
    perform public.self_publish_submission('a4000000-0000-4000-8000-000000000002', 'b4000000-0000-4000-8000-000000000001', 'ivy-x', null);
    raise exception 'Another member''s story was published';
  exception when raise_exception then
    if sqlerrm <> 'submission is not publishable' then raise; end if;
  end;
  begin
    perform public.self_publish_submission('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000003', 'ivy-y', null);
    raise exception 'A story without consent was published';
  exception when raise_exception then
    if sqlerrm <> 'story consent is required' then raise; end if;
  end;

  published_slug := public.self_publish_submission('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'ivy-ab12', null, null, 36.154, -95.993, 'city');
  if published_slug <> 'ivy-ab12' then raise exception 'Wrong slug returned'; end if;
  if (select status from public.submissions where id = 'b4000000-0000-4000-8000-000000000001') <> 'published' then
    raise exception 'The submission was not marked published';
  end if;
  if not exists (select 1 from public.human_entries_public where slug = 'ivy-ab12' and first_name = 'Ivy' and public_location_precision = 'city') then
    raise exception 'The story is not public with its city pin';
  end if;
  if (select verified_by from public.consent_records where submission_id = 'b4000000-0000-4000-8000-000000000001') <> 'a4000000-0000-4000-8000-000000000001' then
    raise exception 'Consent was not recorded as confirmed by its author';
  end if;

  -- Editing and resubmitting returns the story to the same entry and link.
  update public.human_entries set published = false where slug = 'ivy-ab12';
  update public.submissions set status = 'submitted', story = 'An update.' where id = 'b4000000-0000-4000-8000-000000000001';
  published_slug := public.self_publish_submission('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'ivy-new1', null);
  if published_slug <> 'ivy-ab12' or (select story from public.human_entries_public where slug = 'ivy-ab12') <> 'An update.' then
    raise exception 'A resubmitted story did not return to its entry';
  end if;
  if (select public_latitude from public.human_entries where slug = 'ivy-ab12') is not null then
    raise exception 'A stale pin was kept after resubmitting without one';
  end if;

  perform public.hold_submission_for_review('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002', 'Looks like a phone number');
  if (select status from public.submissions where id = 'b4000000-0000-4000-8000-000000000002') <> 'in_review'
     or not exists (select 1 from public.moderation_flags where submission_id = 'b4000000-0000-4000-8000-000000000002' and flag = 'visible_private_information') then
    raise exception 'A held story was not queued for staff';
  end if;
  begin
    perform public.self_publish_submission('a4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002', 'ivy-z', null);
    raise exception 'A held story was published';
  exception when raise_exception then
    if sqlerrm <> 'submission is not publishable' then raise; end if;
  end;
end;
$$;

rollback;
