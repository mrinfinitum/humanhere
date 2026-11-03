begin;

insert into public.profiles (id, display_name, username) values
  ('a5000000-0000-4000-8000-000000000001', 'Kit Busy', 'kit');
insert into public.human_entries (slug, type, source, first_name, consent_verified, published, published_at)
select 'limit-test-' || n, 'story', 'editorial', 'Test', true, true, now() from generate_series(1, 61) n;

do $$
declare
  member uuid := 'a5000000-0000-4000-8000-000000000001';
  draft uuid;
begin
  -- Love: 60 an hour.
  insert into public.human_entry_loves (human_entry_id, user_id)
  select id, member from public.human_entries where slug like 'limit-test-%' order by slug limit 60;
  begin
    insert into public.human_entry_loves (human_entry_id, user_id)
    select id, member from public.human_entries where slug like 'limit-test-%' order by slug offset 60 limit 1;
    raise exception 'The love limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'love limit reached' then raise; end if;
  end;

  -- Notes: 20 an hour.
  insert into public.human_entry_notes (human_entry_id, sender_user_id, body)
  select (select id from public.human_entries where slug = 'limit-test-1'), member, 'Thinking of you' from generate_series(1, 20);
  begin
    insert into public.human_entry_notes (human_entry_id, sender_user_id, body)
    values ((select id from public.human_entries where slug = 'limit-test-1'), member, 'One more');
    raise exception 'The note limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'note limit reached' then raise; end if;
  end;

  -- Drafts: 10 an hour.
  insert into public.submissions (user_id, story) select member, 'Draft ' || n from generate_series(1, 10) n;
  begin
    insert into public.submissions (user_id, story) values (member, 'Draft 11');
    raise exception 'The draft limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'draft limit reached' then raise; end if;
  end;

  -- Posts: 5 an hour, counted as drafts are shared.
  update public.submissions set status = 'submitted', submitted_at = now()
  where id in (select id from public.submissions where user_id = member order by story limit 5);
  select id into draft from public.submissions where user_id = member and status = 'draft' limit 1;
  begin
    update public.submissions set status = 'submitted', submitted_at = now() where id = draft;
    raise exception 'The post limit was not enforced';
  exception when raise_exception then
    if sqlerrm <> 'post limit reached' then raise; end if;
  end;
  -- Editing a draft is never limited.
  update public.submissions set story = 'Still writing' where id = draft;
end;
$$;

rollback;
