begin;

insert into public.profiles (id, display_name, username) values
  ('a3000000-0000-4000-8000-000000000001', 'Fay Open', 'fay'),
  ('a3000000-0000-4000-8000-000000000002', 'Gus Quiet', 'gus'),
  ('a3000000-0000-4000-8000-000000000003', 'Hal Viewer', 'hal');
-- Gus follows Fay; Fay follows Gus; Hal follows Fay.
insert into public.follows (follower_id, followee_id) values
  ('a3000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002'),
  ('a3000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000001');

-- Gus hides his lists through his own column grant.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a3000000-0000-4000-8000-000000000002')::text, true);
update public.profiles set hide_follow_lists = true where id = 'a3000000-0000-4000-8000-000000000002';
do $$
begin
  if (select count(*) from public.member_follow_list('gus', 'followers')) <> 1 then
    raise exception 'A hidden member could not see their own followers';
  end if;
  if (select lists_hidden from public.member_profile('gus')) then
    raise exception 'A member was told their own lists are hidden from them';
  end if;
end;
$$;

-- Hal sees neither Gus's lists nor Gus in Fay's lists, but the totals stay.
select set_config('request.jwt.claims', json_build_object('sub', 'a3000000-0000-4000-8000-000000000003')::text, true);
do $$
begin
  if exists (select 1 from public.member_follow_list('gus', 'followers')) or exists (select 1 from public.member_follow_list('gus', 'following')) then
    raise exception 'PRIVACY FAILURE: a hidden member''s lists were shown';
  end if;
  if not (select lists_hidden from public.member_profile('gus')) then
    raise exception 'The profile did not say the lists are hidden';
  end if;
  if (select array_agg(username) from public.member_follow_list('fay', 'followers')) <> array['hal'] then
    raise exception 'PRIVACY FAILURE: a hidden member appeared in someone else''s list';
  end if;
  if exists (select 1 from public.member_follow_list('fay', 'following')) then
    raise exception 'PRIVACY FAILURE: a hidden member appeared in someone else''s following list';
  end if;
  if (select followers from public.member_profile('fay')) <> 2 then
    raise exception 'Totals should still count hidden members';
  end if;
end;
$$;

-- Fay can still see Gus among her own followers.
select set_config('request.jwt.claims', json_build_object('sub', 'a3000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  if (select count(*) from public.member_follow_list('fay', 'followers')) <> 2 then
    raise exception 'A member could not see everyone who follows them';
  end if;
end;
$$;

-- Another member cannot change someone else's setting.
update public.profiles set hide_follow_lists = false where id = 'a3000000-0000-4000-8000-000000000002';
reset role;
do $$
begin
  if not (select hide_follow_lists from public.profiles where id = 'a3000000-0000-4000-8000-000000000002') then
    raise exception 'RLS FAILURE: a member changed another member''s privacy setting';
  end if;
end;
$$;

rollback;
