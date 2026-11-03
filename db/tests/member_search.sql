begin;

insert into public.profiles (id, display_name, username) values
  ('c1000000-0000-4000-8000-000000000001', 'Maya Rivers', 'maya_r'),
  ('c1000000-0000-4000-8000-000000000002', 'Mayra Lopez', 'mayra'),
  ('c1000000-0000-4000-8000-000000000003', 'No Handle Yet', null),
  ('c1000000-0000-4000-8000-000000000004', '100% Real', 'percent');

set local role anonymous;
select set_config('request.jwt.claims', json_build_object('sub', 'anonymous-guest-token')::text, true);
do $$
begin
  if (select array_agg(username order by username) from public.search_members('may')) <> array['maya_r', 'mayra'] then
    raise exception 'Search by username prefix is wrong';
  end if;
  if (select username from public.search_members('@MAYRA') limit 1) <> 'mayra' then
    raise exception 'An exact @username did not come first';
  end if;
  if (select count(*) from public.search_members('rivers')) <> 1 then
    raise exception 'Search by name is wrong';
  end if;
  if exists (select 1 from public.search_members('handle')) then
    raise exception 'A member without a username appeared';
  end if;
  if exists (select 1 from public.search_members('m')) then
    raise exception 'A one-letter search returned results';
  end if;
  -- Unescaped, "_a" would match any name with an "a" after its first letter.
  if exists (select 1 from public.search_members('_a')) then
    raise exception 'An underscore was treated as a wildcard';
  end if;
  if (select count(*) from public.search_members('100%')) <> 1 then
    raise exception 'A literal percent sign did not match';
  end if;
end;
$$;

rollback;
