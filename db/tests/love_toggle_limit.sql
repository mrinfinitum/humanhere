begin;

insert into public.profiles (id, display_name, username) values
  ('a6000000-0000-4000-8000-000000000001', 'Toggle Tester', 'toggler');
insert into public.human_entries (slug, type, source, first_name, consent_verified, published, published_at)
values ('toggle-test', 'story', 'editorial', 'Test', true, true, now());

do $$
declare
  member uuid := 'a6000000-0000-4000-8000-000000000001';
  entry uuid := (select id from public.human_entries where slug = 'toggle-test');
begin
  -- Loving and un-loving the same story 60 times uses up the hour.
  for i in 1..60 loop
    insert into public.human_entry_loves (human_entry_id, user_id) values (entry, member);
    delete from public.human_entry_loves where human_entry_id = entry and user_id = member;
  end loop;
  begin
    insert into public.human_entry_loves (human_entry_id, user_id) values (entry, member);
    raise exception 'Toggling love reset the limit';
  exception when raise_exception then
    if sqlerrm <> 'love limit reached' then raise; end if;
  end;

  -- Old log rows are pruned and never count.
  update public.member_rate_events set created_at = now() - interval '3 days' where user_id = member;
  insert into public.human_entry_loves (human_entry_id, user_id) values (entry, member);
  if (select count(*) from public.member_rate_events where user_id = member) <> 1 then
    raise exception 'Old love log rows were not pruned';
  end if;
end;
$$;

-- Members cannot read or write the log.
set local role authenticated;
do $$
begin
  perform 1 from public.member_rate_events limit 1;
  raise exception 'Members can read the love log';
exception when insufficient_privilege then null;
end;
$$;
reset role;

rollback;
