-- Run against a disposable local Supabase database after migrations.
-- The transaction is rolled back; failure raises and stops the test.
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

insert into public.submissions (id, user_id, status, story)
values ('11000000-0000-0000-0000-000000000001', auth.uid(), 'draft', 'private test one');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

do $$
begin
  if exists (select 1 from public.submissions where id = '11000000-0000-0000-0000-000000000001') then
    raise exception 'RLS FAILURE: user two can read user one submission';
  end if;
end;
$$;

insert into public.submissions (id, user_id, status, story)
values ('22000000-0000-0000-0000-000000000002', auth.uid(), 'draft', 'private test two');

do $$
begin
  if (select count(*) from public.submissions) <> 1 then
    raise exception 'RLS FAILURE: user two should see exactly one owned submission';
  end if;
end;
$$;

rollback;
