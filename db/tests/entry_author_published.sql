begin;

insert into public.profiles (id, display_name, username) values
  ('a2100000-0000-4000-8000-000000000001', 'Ada Writer', 'ada_author');
insert into public.human_entries (id, slug, type, source, first_name, anonymous, subject_user_id, consent_verified, published, published_at) values
  ('a2100000-0000-4000-8000-0000000000a1', 'author-test-live', 'story', 'direct', 'Ada', false, 'a2100000-0000-4000-8000-000000000001', true, true, now()),
  ('a2100000-0000-4000-8000-0000000000a2', 'author-test-removed', 'story', 'direct', 'Ada', false, 'a2100000-0000-4000-8000-000000000001', true, false, null);

set local role anonymous;
do $$
begin
  if public.entry_author_username('a2100000-0000-4000-8000-0000000000a1') is distinct from 'ada_author' then
    raise exception 'A published story lost its author';
  end if;
  if public.entry_author_username('a2100000-0000-4000-8000-0000000000a2') is not null then
    raise exception 'An unpublished story still names its author';
  end if;
end;
$$;

rollback;
