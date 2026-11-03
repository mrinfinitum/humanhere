begin;

-- Members can keep who they follow, and who follows them, to themselves.
-- A hidden member's own lists show nobody to others, and they are left out of
-- everyone else's lists too, so the relationship is not visible from either
-- side. Totals still count them.
alter table public.profiles add column hide_follow_lists boolean not null default false;
grant update (hide_follow_lists) on public.profiles to authenticated;

drop function public.member_profile(text);
create function public.member_profile(p_username text)
returns table (
  username text, display_name text, bio text, joined_at timestamptz,
  followers integer, following integer, viewer_follows boolean, is_self boolean,
  loves integer, notes integer, gifts integer, avatar_path text, lists_hidden boolean
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
    p.hide_follow_lists and not coalesce(p.id = public.current_member_id(), false)
  from public.profiles p
  cross join lateral public.member_experience_counts(p.id) c
  where p.username = lower(btrim(p_username));
$$;
revoke all on function public.member_profile(text) from public;
grant execute on function public.member_profile(text) to anonymous, authenticated;

create or replace function public.member_follow_list(p_username text, p_direction text, p_limit integer default 50, p_before timestamptz default null)
returns table (username text, display_name text, avatar_path text, followed_at timestamptz, viewer_follows boolean, is_self boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target uuid;
  target_hidden boolean;
  viewer uuid := public.current_member_id();
begin
  if viewer is null then
    raise exception 'authentication required';
  end if;
  if p_direction not in ('followers', 'following') then
    raise exception 'invalid direction';
  end if;
  select id, hide_follow_lists into target, target_hidden from public.profiles where profiles.username = lower(btrim(p_username));
  if target is null or (target_hidden and target <> viewer) then
    return;
  end if;
  return query
    select p.username, p.display_name, p.avatar_path, f.created_at,
      exists (select 1 from public.follows v where v.follower_id = viewer and v.followee_id = p.id),
      p.id = viewer
    from public.follows f
    join public.profiles p on p.id = case when p_direction = 'followers' then f.follower_id else f.followee_id end
    where (case when p_direction = 'followers' then f.followee_id else f.follower_id end) = target
      and p.username is not null
      and (not p.hide_follow_lists or p.id = viewer or target = viewer)
      and (p_before is null or f.created_at < p_before)
    order by f.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;
revoke all on function public.member_follow_list(text, text, integer, timestamptz) from public, anonymous;
grant execute on function public.member_follow_list(text, text, integer, timestamptz) to authenticated;

commit;
