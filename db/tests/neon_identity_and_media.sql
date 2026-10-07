begin;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '61000000-0000-4000-8000-000000000001')::text, true);
select public.ensure_profile('First user');
select public.ensure_profile('Retry');
do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Profile initialization must be idempotent'; end if;
  if (select role from public.profiles limit 1) <> 'user' then raise exception 'New identities must not be staff'; end if;
end;
$$;
reset role;
insert into public.submissions (id, user_id, story)
values ('62000000-0000-4000-8000-000000000001', public.request_user_id()::uuid, 'Private story');
set local role authenticated;

do $$
begin
  begin
    insert into public.submission_media (submission_id, media_type, storage_path, mime_type, byte_size)
    values ('62000000-0000-4000-8000-000000000001', 'image',
      '63000000-0000-4000-8000-000000000001/62000000-0000-4000-8000-000000000001/64000000-0000-4000-8000-000000000001.jpg', 'image/jpeg', 100);
    raise exception 'A user attached another user''s file';
  exception when insufficient_privilege then null;
  end;
end;
$$;
insert into public.submission_media (submission_id, media_type, storage_path, mime_type, byte_size)
values ('62000000-0000-4000-8000-000000000001', 'image',
  '61000000-0000-4000-8000-000000000001/62000000-0000-4000-8000-000000000001/64000000-0000-4000-8000-000000000001.jpg', 'image/jpeg', 100);

do $$
begin
  begin
    insert into public.submission_media (submission_id, media_type, storage_path, mime_type, byte_size, blur_data_url)
    values ('62000000-0000-4000-8000-000000000001', 'image',
      '61000000-0000-4000-8000-000000000001/62000000-0000-4000-8000-000000000001/65000000-0000-4000-8000-000000000001.jpg', 'image/jpeg', 100, 'data:image/png;base64,');
    raise exception 'A user supplied public media presentation metadata';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.submission_media set storage_path = 'changed';
    raise exception 'A user changed a registered object key';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role anonymous;
select set_config('request.jwt.claims', json_build_object('sub', null)::text, true);
do $$
begin
  begin
    perform public.ensure_profile('Anonymous');
    raise exception 'Anonymous visitors created an account profile';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
