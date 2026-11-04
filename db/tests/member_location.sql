begin;

insert into public.profiles (id, display_name, username) values
  ('a7000000-0000-4000-8000-000000000001', 'Lou Place', 'lou'),
  ('a7000000-0000-4000-8000-000000000002', 'Other Person', 'other');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000001')::text, true);

-- City and state are the member's to set, and show on the public profile.
update public.profiles set city = 'Columbus', region = 'OH' where id = 'a7000000-0000-4000-8000-000000000001';

-- The address saves while SHOW UP is off, as long as it asks for no help.
insert into public.fulfillment_profiles (user_id, address_line_1, city, state, postal_code, country)
values ('a7000000-0000-4000-8000-000000000001', '1 Main St', 'Columbus', 'OH', '43215', 'US');
update public.fulfillment_profiles set address_line_2 = 'Apt 2' where user_id = 'a7000000-0000-4000-8000-000000000001';

do $$
begin
  update public.fulfillment_profiles set allow_tangible_help = true where user_id = 'a7000000-0000-4000-8000-000000000001';
  raise exception 'Help was turned on without SHOW UP or consent';
exception when insufficient_privilege or check_violation then null;
end;
$$;

-- Another member can see the city but never the address.
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-000000000002')::text, true);
do $$
begin
  if (select city || ', ' || region from public.member_profile('lou')) <> 'Columbus, OH' then
    raise exception 'The public profile does not show the city and state';
  end if;
  if exists (select 1 from public.fulfillment_profiles where user_id = 'a7000000-0000-4000-8000-000000000001') then
    raise exception 'Another member can read the address';
  end if;
end;
$$;
do $$
begin
  update public.profiles set city = 'Elsewhere' where id = 'a7000000-0000-4000-8000-000000000001';
  if (select city from public.member_profile('lou')) <> 'Columbus' then
    raise exception 'Another member changed the city';
  end if;
end;
$$;

-- Signed-out visitors can see the city but cannot read addresses at all.
reset role;
set local role anonymous;
select set_config('request.jwt.claims', '', true);
do $$
begin
  if (select city from public.member_profile('lou')) <> 'Columbus' then
    raise exception 'Visitors cannot see the city';
  end if;
  perform 1 from public.fulfillment_profiles limit 1;
  raise exception 'Visitors can read addresses';
exception when insufficient_privilege then null;
end;
$$;
reset role;

rollback;
