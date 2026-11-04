begin;

-- A member can show a city and state on their profile, and keep a full
-- mailing address that is never public.

-- Public: shown on the profile when filled in.
alter table public.profiles
  add column city text check (city is null or (length(btrim(city)) between 1 and 80)),
  add column region text check (region is null or (length(btrim(region)) between 1 and 80));
grant update (city, region) on public.profiles to authenticated;

-- Private: the existing fulfillment profile holds the address. Writing it was
-- gated on SHOW UP being enabled; a member may now save or change their own
-- address at any time, as long as it asks for no help or partner referral.
-- Turning on tangible help or partner referral still needs SHOW UP and a
-- current consent record, exactly as before.
drop policy fulfillment_profiles_insert_own on public.fulfillment_profiles;
create policy fulfillment_profiles_insert_own on public.fulfillment_profiles for insert to authenticated
  with check (
    user_id = auth.user_id()::uuid and verified_at is null and verified_by is null
    and (
      (not allow_tangible_help and not allow_partner_referral)
      or (public.is_show_up_enabled() and exists (
        select 1 from (
          select * from public.help_consent_records
          where user_id = auth.user_id()::uuid
          order by created_at desc, id desc limit 1
        ) latest
        where latest.revoked_at is null
          and (not allow_tangible_help or latest.allow_help_requests = true)
          and (not allow_partner_referral or latest.allow_partner_contact = true)
      ))
    )
  );
drop policy fulfillment_profiles_update_own on public.fulfillment_profiles;
create policy fulfillment_profiles_update_own on public.fulfillment_profiles for update to authenticated
  using (user_id = auth.user_id()::uuid)
  with check (
    user_id = auth.user_id()::uuid
    and (
      (not allow_tangible_help and not allow_partner_referral)
      or (public.is_show_up_enabled() and exists (
        select 1 from (
          select * from public.help_consent_records
          where user_id = auth.user_id()::uuid
          order by created_at desc, id desc limit 1
        ) latest
        where latest.revoked_at is null
          and (not allow_tangible_help or latest.allow_help_requests = true)
          and (not allow_partner_referral or latest.allow_partner_contact = true)
      ))
    )
  );

drop function public.member_profile(text);
create function public.member_profile(p_username text)
returns table (
  username text, display_name text, bio text, joined_at timestamptz,
  followers integer, following integer, viewer_follows boolean, is_self boolean,
  loves integer, notes integer, gifts integer, avatar_path text, lists_hidden boolean,
  city text, region text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.username, p.display_name, p.bio, p.created_at,
    (select count(*)::integer from public.follows where followee_id = p.id),
    (select count(*)::integer from public.follows where follower_id = p.id),
    exists (select 1 from public.follows where follower_id = public.current_member_id() and followee_id = p.id),
    coalesce(p.id = public.current_member_id(), false),
    c.loves, c.notes, c.gifts, p.avatar_path,
    p.hide_follow_lists and not coalesce(p.id = public.current_member_id(), false),
    p.city, p.region
  from public.profiles p
  cross join lateral public.member_experience_counts(p.id) c
  where p.username = lower(btrim(p_username));
$$;
revoke all on function public.member_profile(text) from public;
grant execute on function public.member_profile(text) to anonymous, authenticated;

commit;
