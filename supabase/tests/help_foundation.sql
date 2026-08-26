-- Run after all migrations against a disposable local Supabase database.
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'help-one@example.test', '', now(), now(), now()),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'help-two@example.test', '', now(), now(), now()),
  ('53000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'partner@example.test', '', now(), now(), now());

insert into public.human_entries (
  id, slug, type, source, first_name, display_location, subject_user_id,
  published, published_at
) values
  ('54000000-0000-0000-0000-000000000001', 'help-test-human-one', 'story', 'editorial', 'One', 'Tulsa', '51000000-0000-0000-0000-000000000001', true, now()),
  ('54000000-0000-0000-0000-000000000002', 'help-test-human-two', 'story', 'editorial', 'Two', 'Dallas', '52000000-0000-0000-0000-000000000002', true, now());

insert into public.fulfillment_profiles (
  user_id, legal_delivery_name, phone, address_line_1, city, state, postal_code,
  country, delivery_notes, preferred_delivery_mode
) values
  ('51000000-0000-0000-0000-000000000001', 'Private One', '+1-555-0001', '100 Hidden Street', 'Tulsa', 'OK', '74100', 'US', 'Private delivery note one', 'address_withheld'),
  ('52000000-0000-0000-0000-000000000002', 'Private Two', '+1-555-0002', '200 Hidden Street', 'Dallas', 'TX', '75000', 'US', 'Private delivery note two', 'address_withheld');

insert into public.human_needs (
  id, human_entry_id, recipient_user_id, need_type, public_title,
  private_notes, status, delivery_mode
) values
  ('55000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'groceries', 'Groceries this week', 'Private need one', 'draft', 'address_withheld'),
  ('55000000-0000-0000-0000-000000000002', '54000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'transportation', 'A ride to an appointment', 'Private need two', 'verifying', 'partner_delivery');

insert into public.help_partners (
  id, name, slug, partner_type, city, state, country, internal_contact_name,
  internal_email, status, can_verify_needs, can_receive_deliveries, can_fulfill_needs
) values (
  '56000000-0000-0000-0000-000000000001', 'Test Community Partner', 'test-community-partner',
  'community_org', 'Tulsa', 'OK', 'US', 'Private Coordinator', 'partner-private@example.test',
  'active', true, true, true
);

insert into public.help_partner_memberships (partner_id, user_id, role)
values ('56000000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000000003', 'coordinator');

insert into public.human_need_partner_assignments (
  human_need_id, partner_id, status
) values (
  '55000000-0000-0000-0000-000000000002',
  '56000000-0000-0000-0000-000000000001',
  'accepted'
);

set local role anon;
do $$
begin
  begin
    perform 1 from public.fulfillment_profiles;
    raise exception 'RLS FAILURE: public can read fulfillment profiles';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '52000000-0000-0000-0000-000000000002', true);

do $$
begin
  if exists (
    select 1 from public.fulfillment_profiles
    where user_id = '51000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'RLS FAILURE: user can read another fulfillment profile';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000001', true);

do $$
begin
  begin
    update public.human_needs
    set verification_status = 'staff_verified', verified_at = now(), verified_by = auth.uid()
    where id = '55000000-0000-0000-0000-000000000001';
    raise exception 'RLS FAILURE: user self-verified a need';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.human_needs (
      human_entry_id, recipient_user_id, need_type, public_title
    ) values (
      '54000000-0000-0000-0000-000000000001', auth.uid(), 'school', 'School supplies'
    );
    raise exception 'FEATURE FLAG FAILURE: disabled SHOW UP accepted a user need mutation';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.get_fulfillment_profile_for_help(auth.uid());
    raise exception 'RLS FAILURE: ordinary user invoked staff fulfillment profile access';
  exception when raise_exception then
    if sqlerrm <> 'not authorized' then raise; end if;
  end;
end;
$$;

reset role;
do $$
begin
  if (select count(*) from public.human_needs_public) <> 0 then
    raise exception 'FEATURE FLAG FAILURE: public needs visible while SHOW UP is disabled';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'human_needs_public'
      and column_name in (
        'recipient_user_id', 'private_notes', 'partner_id', 'delivery_mode',
        'address_line_1', 'phone', 'email', 'provider_order_reference'
      )
  ) then
    raise exception 'PUBLIC PROJECTION FAILURE: public human needs expose private fields';
  end if;
end;
$$;

update public.help_feature_flags set enabled = true where key = 'show_up_enabled';

set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000001', true);

do $$
begin
  begin
    update public.human_needs
    set status = 'approved'
    where id = '55000000-0000-0000-0000-000000000001';
    raise exception 'RLS FAILURE: user self-approved a need';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '53000000-0000-0000-0000-000000000003', true);

do $$
begin
  if not exists (
    select 1 from public.human_needs
    where id = '55000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'RLS FAILURE: partner cannot read explicitly assigned need';
  end if;
  if exists (
    select 1 from public.human_needs
    where id = '55000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'RLS FAILURE: partner can browse an unrelated need';
  end if;
end;
$$;

reset role;
update public.help_feature_flags set enabled = false where key = 'show_up_enabled';

rollback;
