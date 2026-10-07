-- Run against a disposable local Neon-compatible PostgreSQL database after migrations.
-- The transaction is rolled back; failure raises and stops the test.
begin;

insert into public.profiles (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000001')::text, true);

insert into public.submissions (user_id, story)
values (public.request_user_id()::uuid, 'private test one');

do $$
begin
  begin
    update public.profiles set role = 'admin' where id = public.request_user_id()::uuid;
    raise exception 'RLS FAILURE: normal user changed profiles.role';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
do $$
begin
  if (select role from public.profiles where id = '10000000-0000-0000-0000-000000000001') <> 'user' then
    raise exception 'RLS FAILURE: profile role escalated';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '20000000-0000-0000-0000-000000000002')::text, true);

do $$
begin
  if exists (select 1 from public.submissions where story = 'private test one') then
    raise exception 'RLS FAILURE: user two can read user one submission';
  end if;
end;
$$;

insert into public.submissions (user_id, story)
values (public.request_user_id()::uuid, 'private test two');

do $$
begin
  if (select count(*) from public.submissions) <> 1 then
    raise exception 'RLS FAILURE: user two should see exactly one owned submission';
  end if;
end;
$$;

do $$
declare
  own_submission_id uuid;
begin
  select id into own_submission_id from public.submissions where user_id = public.request_user_id()::uuid limit 1;
  begin
    execute format(
      'insert into public.consent_records (submission_id, user_id, publish_story, verified_at, verified_by) values (%L, %L, true, now(), %L)',
      own_submission_id, public.request_user_id()::uuid, public.request_user_id()::uuid
    );
    raise exception 'RLS FAILURE: normal user forged verified consent';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
insert into public.human_entries (
  id, slug, type, source, first_name, display_location, subject_user_id,
  allow_private_notes, published, published_at
) values (
  '30000000-0000-0000-0000-000000000003', 'rls-test-human', 'story', 'editorial',
  'One', 'Tulsa', '10000000-0000-0000-0000-000000000001', true, true, now()
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '20000000-0000-0000-0000-000000000002')::text, true);

do $$
begin
  begin
    perform public.set_human_entry_public_location(
      '30000000-0000-0000-0000-000000000003', 36.15398, -95.99277, 'city'
    );
    raise exception 'RLS FAILURE: normal user approved a globe location';
  exception when raise_exception then
    if sqlerrm = 'RLS FAILURE: normal user approved a globe location' then
      raise;
    end if;
    if sqlerrm <> 'not authorized' then
      raise;
    end if;
  end;
end;
$$;

insert into public.human_entry_loves (human_entry_id, user_id)
values ('30000000-0000-0000-0000-000000000003', public.request_user_id()::uuid);

do $$
begin
  begin
    insert into public.human_entry_loves (human_entry_id, user_id)
    values ('30000000-0000-0000-0000-000000000003', public.request_user_id()::uuid);
    raise exception 'RLS FAILURE: duplicate love was accepted';
  exception when unique_violation then
    null;
  end;
end;
$$;

select public.submit_private_note('30000000-0000-0000-0000-000000000003', 'I see you.');

reset role;
update public.human_entries
set public_latitude = 36.15398,
    public_longitude = -95.99277,
    public_location_precision = 'city',
    public_location_approved_at = now(),
    public_location_approved_by = '10000000-0000-0000-0000-000000000001'
where id = '30000000-0000-0000-0000-000000000003';

do $$
begin
  if (select love_count from public.human_entries where id = '30000000-0000-0000-0000-000000000003') <> 1 then
    raise exception 'RLS FAILURE: aggregate love count did not increment';
  end if;
end;
$$;

update public.human_entry_notes
set moderation_status = 'approved', approved_at = now(), recipient_visible = true
where human_entry_id = '30000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000001')::text, true);

do $$
begin
  if exists (select 1 from public.human_entry_loves) then
    raise exception 'RLS FAILURE: user one can see user two love rows';
  end if;
  if exists (select 1 from public.human_entry_notes) then
    raise exception 'RLS FAILURE: recipient can query private note base rows';
  end if;
  if (select count(*) from public.notes_for_me()) <> 1 then
    raise exception 'RLS FAILURE: approved recipient note was not delivered through safe projection';
  end if;
end;
$$;

reset role;
set local role anonymous;
do $$
begin
  if (select count(*) from public.human_entries_public where slug = 'rls-test-human') <> 1 then
    raise exception 'RLS FAILURE: published public entry is not readable';
  end if;
  if not exists (
    select 1 from public.human_entries_public
    where slug = 'rls-test-human'
      and public_latitude = 36.15398
      and public_longitude = -95.99277
      and public_location_precision = 'city'
  ) then
    raise exception 'PUBLIC PROJECTION FAILURE: approved public coordinates are unavailable';
  end if;
end;
$$;

reset role;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'human_entries_public'
      and column_name in (
        'public_name', 'age', 'source_url', 'subject_user_id', 'consent_verified',
        'public_location_approved_at', 'public_location_approved_by'
      )
  ) then
    raise exception 'PUBLIC PROJECTION FAILURE: private or unnecessary fields are exposed';
  end if;
end;
$$;

rollback;
