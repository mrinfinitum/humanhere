begin;

insert into public.profiles (id, display_name) values
  ('91000000-0000-4000-8000-000000000001', 'Giver'),
  ('91000000-0000-4000-8000-000000000002', 'Owner'),
  ('91000000-0000-4000-8000-000000000003', 'Hidden');
insert into public.human_entries (id, slug, type, source, first_name, subject_user_id, consent_verified, published, published_at) values
  ('92000000-0000-4000-8000-000000000001', 'level-test-other', 'story', 'editorial', 'Other', null, true, true, now()),
  ('92000000-0000-4000-8000-000000000002', 'level-test-own', 'story', 'editorial', 'Giver', '91000000-0000-4000-8000-000000000001', true, true, now());
insert into public.human_entry_loves (human_entry_id, user_id) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001');
insert into public.human_entry_notes (human_entry_id, sender_user_id, body, moderation_status, approved_at) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Approved', 'approved', now()),
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Waiting', 'pending', null);
insert into public.member_gifts (user_id, provider, provider_reference, status) values
  ('91000000-0000-4000-8000-000000000001', 'test', 'gift-1', 'succeeded'),
  ('91000000-0000-4000-8000-000000000001', 'test', 'gift-2', 'refunded'),
  ('91000000-0000-4000-8000-000000000002', 'test', 'gift-3', 'succeeded');
update public.profiles set username = 'giver' where id = '91000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '91000000-0000-4000-8000-000000000001')::text, true);
do $$
declare
  counts record;
begin
  select * into counts from public.my_experience();
  -- Only the love on someone else's story, the approved note and the succeeded gift count.
  if counts.loves <> 1 or counts.notes <> 1 or counts.gifts <> 1 then
    raise exception 'Experience counted the wrong records: % % %', counts.loves, counts.notes, counts.gifts;
  end if;
  if (select count(*) from public.member_gifts) <> 2 then
    raise exception 'RLS FAILURE: a member can see gifts that are not theirs';
  end if;
  begin
    insert into public.member_gifts (user_id, provider, provider_reference)
    values ('91000000-0000-4000-8000-000000000001', 'test', 'forged');
    raise exception 'RLS FAILURE: a member recorded their own gift';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.member_experience_counts('91000000-0000-4000-8000-000000000002');
    raise exception 'RLS FAILURE: a member read another member''s counts directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set username = 'chosen' where id = '91000000-0000-4000-8000-000000000001';
    raise exception 'RLS FAILURE: a member set a username without claiming it';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role anonymous;
select set_config('request.jwt.claims', '', true);
do $$
declare
  shown record;
begin
  select * into shown from public.member_profile('giver');
  if shown.display_name <> 'Giver' or shown.loves <> 1 or shown.gifts <> 1 then
    raise exception 'Public profile did not show the opted-in member';
  end if;
end;
$$;

rollback;
