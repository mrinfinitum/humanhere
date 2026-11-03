begin;

insert into public.profiles (id, display_name, username) values
  ('a2000000-0000-4000-8000-000000000001', 'Cara Lane', 'cara'),
  ('a2000000-0000-4000-8000-000000000002', 'Dev Hart', 'dev'),
  ('a2000000-0000-4000-8000-000000000003', 'Eli Moss', 'eli');
insert into public.follows (follower_id, followee_id, created_at) values
  ('a2000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', now() - interval '2 days'),
  ('a2000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000001', now() - interval '1 day'),
  ('a2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000003', now());

-- Only the server sets a photo, and only to a path in the avatars folder.
do $$
begin
  begin
    update public.profiles set avatar_path = '../secret.jpg' where id = 'a2000000-0000-4000-8000-000000000001';
    raise exception 'An avatar path outside the avatars folder was accepted';
  exception when check_violation then null;
  end;
  update public.profiles set avatar_path = 'avatars/a2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-000000000001.jpg'
  where id = 'a2000000-0000-4000-8000-000000000001';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a2000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  begin
    update public.profiles set avatar_path = null where id = 'a2000000-0000-4000-8000-000000000001';
    raise exception 'RLS FAILURE: a member changed their avatar path directly';
  exception when insufficient_privilege then null;
  end;
  if (select avatar_path from public.member_profile('cara')) not like 'avatars/%' then
    raise exception 'The profile did not return the avatar';
  end if;
  if (select avatar_path from public.search_members('cara')) is null then
    raise exception 'Search did not return the avatar';
  end if;
  -- Followers arrive newest first, with the viewer's own follow state.
  if (select array_agg(username) from public.member_follow_list('cara', 'followers')) <> array['eli', 'dev'] then
    raise exception 'The followers list is wrong';
  end if;
  if not (select viewer_follows from public.member_follow_list('cara', 'followers') where username = 'eli')
     or (select viewer_follows from public.member_follow_list('cara', 'followers') where username = 'dev') then
    raise exception 'The followers list did not show who the viewer follows';
  end if;
  if (select array_agg(username) from public.member_follow_list('cara', 'following')) <> array['eli'] then
    raise exception 'The following list is wrong';
  end if;
  if exists (select 1 from public.member_follow_list('nobody', 'followers')) then
    raise exception 'An unknown member returned a list';
  end if;
  begin
    perform public.member_follow_list('cara', 'everyone');
    raise exception 'An invalid list direction was accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid direction' then raise; end if;
  end;
end;
$$;

-- Guests see the totals but not the names behind them.
set local role anonymous;
select set_config('request.jwt.claims', json_build_object('sub', 'anonymous-guest-token')::text, true);
do $$
begin
  if (select followers from public.member_profile('cara')) <> 2 then
    raise exception 'A guest could not read follower totals';
  end if;
  begin
    perform public.member_follow_list('cara', 'followers');
    raise exception 'RLS FAILURE: a guest read a followers list';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
