begin;

insert into public.profiles (id, display_name) values
  ('71000000-0000-4000-8000-000000000001', 'Owner'),
  ('71000000-0000-4000-8000-000000000002', 'Other');
insert into public.submissions (id, user_id, story, status, submitted_at)
values ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Published story', 'published', now());
insert into public.consent_records (submission_id, user_id, publish_story, verified_at, verified_by)
values ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', true, now(), '71000000-0000-4000-8000-000000000001');
insert into public.human_entries (slug, type, source, first_name, submission_id, subject_user_id, consent_verified, published, published_at)
values ('revocation-test-human', 'story', 'direct', 'Owner', '72000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000001', true, true, now());

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '71000000-0000-4000-8000-000000000002')::text, true);
do $$
begin
  begin
    perform public.revoke_owned_submission_consent('72000000-0000-4000-8000-000000000001');
    raise exception 'RLS FAILURE: another user revoked consent';
  exception when raise_exception then
    if sqlerrm <> 'not authorized' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claims', json_build_object('sub', '71000000-0000-4000-8000-000000000001')::text, true);
do $$
declare
  slugs text[];
begin
  slugs := public.revoke_owned_submission_consent('72000000-0000-4000-8000-000000000001');
  if slugs <> array['revocation-test-human'] then raise exception 'Revocation did not return the published slug'; end if;
  if exists (select 1 from public.human_entries_public where slug = 'revocation-test-human') then
    raise exception 'Revoked story is still public';
  end if;
end;
$$;

reset role;
do $$
begin
  if (select status from public.submissions where id = '72000000-0000-4000-8000-000000000001') <> 'archived' then
    raise exception 'Revoked submission was not archived';
  end if;
  if exists (select 1 from public.consent_records where submission_id = '72000000-0000-4000-8000-000000000001' and revoked_at is null) then
    raise exception 'Consent record was not revoked';
  end if;
end;
$$;

rollback;
