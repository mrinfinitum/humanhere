begin;

insert into public.profiles (id, display_name, username, role) values
  ('a7000000-0000-4000-8000-000000000001', 'Rae Author', 'rae', 'user'),
  ('a7000000-0000-4000-8000-000000000002', 'Mo Moderator', 'mod_mo', 'moderator'),
  ('a7000000-0000-4000-8000-000000000003', 'Ed Editor', 'ed_editor', 'editor');
insert into public.submissions (id, user_id, public_name, headline, story, status, submitted_at) values
  ('b7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Rae Lee', 'First', 'A story.', 'submitted', now()),
  ('b7000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000001', 'Rae Lee', 'Second', 'Another.', 'submitted', now()),
  ('b7000000-0000-4000-8000-000000000003', 'a7000000-0000-4000-8000-000000000001', 'Rae Lee', 'Third', 'A draft.', 'draft', null);
insert into public.consent_records (submission_id, user_id, publish_story, publish_media) values
  ('b7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', true, false),
  ('b7000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000001', true, false);

-- Members cannot call the publishing function.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  begin
    perform public.publish_checked_submission('a7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'First', 'A story.', null, 'rae-x', null);
    raise exception 'RLS FAILURE: a member called publish_checked_submission';
  exception when insufficient_privilege then null;
  end;
  -- Members cannot register media rows themselves.
  begin
    insert into public.submission_media (submission_id, media_type, storage_provider, storage_path, mime_type, byte_size)
    values ('b7000000-0000-4000-8000-000000000003', 'image', 'neon', 'a7000000-0000-4000-8000-000000000001/b7000000-0000-4000-8000-000000000003/x.jpg', 'image/jpeg', 10);
    raise exception 'RLS FAILURE: a member inserted a media row';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Moderators can read members' submissions but not change them.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000002')::text, true);
do $$
declare
  changed integer;
begin
  if not exists (select 1 from public.submissions where id = 'b7000000-0000-4000-8000-000000000001') then
    raise exception 'A moderator cannot read submissions';
  end if;
  update public.submissions set story = 'rewritten' where id = 'b7000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'RLS FAILURE: a moderator rewrote a member''s story'; end if;
end;
$$;
reset role;

-- Editors still can.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000003')::text, true);
do $$
declare
  changed integer;
begin
  update public.submissions set headline = 'First' where id = 'b7000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'An editor could not update a submission'; end if;
end;
$$;
reset role;

do $$
declare
  member uuid := 'a7000000-0000-4000-8000-000000000001';
  published_slug text;
begin
  -- A story changed after the check is not published.
  update public.submissions set story = 'Call me on 555-0100.' where id = 'b7000000-0000-4000-8000-000000000002';
  begin
    perform public.publish_checked_submission(member, 'b7000000-0000-4000-8000-000000000002', 'Second', 'Another.', null, 'rae-cd34', null);
    raise exception 'A story changed after the check was published';
  exception when raise_exception then
    if sqlerrm <> 'submission changed during publishing' then raise; end if;
  end;

  -- An unchanged story publishes.
  published_slug := public.publish_checked_submission(member, 'b7000000-0000-4000-8000-000000000001', 'First', 'A story.', null, 'rae-ab12', null);
  if published_slug <> 'rae-ab12' then raise exception 'Wrong slug returned'; end if;

  -- Re-shared as anonymous, it gets a new link without the first name.
  update public.submissions set status = 'submitted', anonymous = true where id = 'b7000000-0000-4000-8000-000000000001';
  published_slug := public.publish_checked_submission(member, 'b7000000-0000-4000-8000-000000000001', 'First', 'A story.', null, 'human-ef56', null);
  if published_slug <> 'human-ef56' or not exists (select 1 from public.human_entries where slug = 'human-ef56' and anonymous) then
    raise exception 'An anonymous re-share kept the old link';
  end if;
  if exists (select 1 from public.human_entries where slug = 'rae-ab12') then
    raise exception 'The old named link still exists';
  end if;
end;
$$;

-- A takedown sticks: the author cannot withdraw and post it again.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000003')::text, true);
select public.unpublish_human_entry((select id from public.human_entries where slug = 'human-ef56'));
reset role;
do $$
declare
begin
  if (select removed_at from public.human_entries where slug = 'human-ef56') is null then
    raise exception 'The takedown was not recorded';
  end if;
  update public.submissions set status = 'submitted' where id = 'b7000000-0000-4000-8000-000000000001';
  begin
    perform public.publish_checked_submission('a7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'First', 'A story.', null, 'human-gh78', null);
    raise exception 'A removed story was posted again';
  exception when raise_exception then
    if sqlerrm <> 'story was removed by staff' then raise; end if;
  end;
  begin
    update public.human_entries set published = true where slug = 'human-ef56';
    raise exception 'A removed story was republished directly';
  exception when raise_exception then
    if sqlerrm <> 'story was removed by staff' then raise; end if;
  end;
end;
$$;

-- Deleting drafts does not reset the draft limit, and follows are limited.
do $$
declare
  member uuid := 'a7000000-0000-4000-8000-000000000002';
  n integer;
begin
  for n in 1..10 loop
    insert into public.submissions (user_id, story) values (member, 'Draft');
    delete from public.submissions where user_id = member and story = 'Draft';
  end loop;
  begin
    insert into public.submissions (user_id, story) values (member, 'Draft 11');
    raise exception 'Deleting drafts reset the draft limit';
  exception when raise_exception then
    if sqlerrm <> 'draft limit reached' then raise; end if;
  end;

  insert into public.profiles (id, display_name, username)
  select ('c7000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, 'F' || i, 'follow_target_' || i from generate_series(1, 61) i;
  insert into public.follows (follower_id, followee_id)
  select member, ('c7000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid from generate_series(1, 60) i;
  begin
    insert into public.follows (follower_id, followee_id) values (member, 'c7000000-0000-4000-8000-000000000061');
    raise exception 'The follow limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'follow limit reached' then raise; end if;
  end;
end;
$$;

rollback;
