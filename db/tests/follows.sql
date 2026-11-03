begin;

insert into public.profiles (id, display_name) values
  ('a1000000-0000-4000-8000-000000000001', 'Ada Writer'),
  ('a1000000-0000-4000-8000-000000000002', 'Ben Reader');
insert into public.human_entries (slug, type, source, first_name, anonymous, subject_user_id, consent_verified, published, published_at) values
  ('follow-test-named', 'story', 'direct', 'Ada', false, 'a1000000-0000-4000-8000-000000000001', true, true, now()),
  ('follow-test-anonymous', 'story', 'direct', null, true, 'a1000000-0000-4000-8000-000000000001', true, true, now()),
  ('follow-test-unpublished', 'story', 'direct', 'Ada', false, 'a1000000-0000-4000-8000-000000000001', true, false, null);

-- Usernames are claimed, normalized, unique and not reserved.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a1000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  if public.claim_username('  Ada_Writes ') <> 'ada_writes' then raise exception 'Username was not normalized'; end if;
  begin
    perform public.claim_username('admin');
    raise exception 'A reserved username was accepted';
  exception when raise_exception then
    if sqlerrm <> 'username is reserved' then raise; end if;
  end;
  begin
    perform public.claim_username('no spaces');
    raise exception 'An invalid username was accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid username' then raise; end if;
  end;
  begin
    update public.profiles set username = 'chosen' where id = 'a1000000-0000-4000-8000-000000000001';
    raise exception 'RLS FAILURE: a member set a username without claiming it';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claims', json_build_object('sub', 'a1000000-0000-4000-8000-000000000002')::text, true);
do $$
begin
  begin
    perform public.claim_username('ADA_WRITES');
    raise exception 'A taken username was accepted';
  exception when raise_exception then
    if sqlerrm <> 'username is taken' then raise; end if;
  end;
  perform public.claim_username('ben');
  perform public.follow_member('ada_writes');
  perform public.follow_member('ada_writes');
  begin
    perform public.follow_member('ben');
    raise exception 'A member followed themselves';
  exception when raise_exception then
    if sqlerrm <> 'member not found' then raise; end if;
  end;
  -- Only published stories the author did not post anonymously reach the feed.
  if (select array_agg(slug) from public.following_feed()) <> array['follow-test-named'] then
    raise exception 'The following feed is wrong';
  end if;
  if (select followers from public.member_profile('ada_writes')) <> 1 or not (select viewer_follows from public.member_profile('ada_writes')) then
    raise exception 'The profile did not count the follow';
  end if;
  for i in 1..10 loop
    perform public.report_content((select id from public.human_entries_public where slug = 'follow-test-named'), 'spam');
  end loop;
  begin
    perform public.report_content((select id from public.human_entries_public where slug = 'follow-test-named'), 'spam');
    raise exception 'The report limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'report limit reached' then raise; end if;
  end;
  if exists (select 1 from public.content_reports) then
    raise exception 'RLS FAILURE: a member can read reports';
  end if;
  perform public.unfollow_member('ada_writes');
  if exists (select 1 from public.following_feed()) then raise exception 'Unfollowing left stories in the feed'; end if;
end;
$$;

-- Guests carry a token whose subject is not an account id.
set local role anonymous;
select set_config('request.jwt.claims', json_build_object('sub', 'anonymous-guest-token')::text, true);
do $$
begin
  if (select author_username from public.human_entries_public where slug = 'follow-test-named') <> 'ada_writes' then
    raise exception 'A named story did not show its author';
  end if;
  if (select author_username from public.human_entries_public where slug = 'follow-test-anonymous') is not null then
    raise exception 'An anonymous story revealed its author';
  end if;
  if (select display_name from public.member_profile('ada_writes')) <> 'Ada Writer'
     or (select viewer_follows from public.member_profile('ada_writes')) then
    raise exception 'A guest could not read a profile';
  end if;
  begin
    perform public.follow_member('ada_writes');
    raise exception 'RLS FAILURE: a guest followed a member';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
