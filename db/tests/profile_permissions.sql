begin;

insert into public.profiles (id, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'Owner'),
  ('b1000000-0000-4000-8000-000000000002', 'Other');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b1000000-0000-4000-8000-000000000001')::text, true);
do $$
begin
  if (select allow_social_reuse from public.profiles where id = 'b1000000-0000-4000-8000-000000000001') then
    raise exception 'Social sharing was on before the member chose it';
  end if;
  update public.profiles set allow_social_reuse = true where id = 'b1000000-0000-4000-8000-000000000001';
  update public.profiles set allow_social_reuse = true where id = 'b1000000-0000-4000-8000-000000000002';
end;
$$;

reset role;
do $$
begin
  if not (select allow_social_reuse from public.profiles where id = 'b1000000-0000-4000-8000-000000000001') then
    raise exception 'A member could not save their sharing setting';
  end if;
  if (select allow_social_reuse from public.profiles where id = 'b1000000-0000-4000-8000-000000000002') then
    raise exception 'RLS FAILURE: a member changed another member''s sharing setting';
  end if;
end;
$$;

rollback;
