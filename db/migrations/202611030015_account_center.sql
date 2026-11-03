begin;

-- Members can add a profile photo and see who follows whom.
-- The photo is a square image the server writes to the public media bucket;
-- members never set its path directly, so it is not in their update grant.
alter table public.profiles
  add column avatar_path text check (avatar_path is null or avatar_path ~ '^avatars/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|webp)$');

drop function public.member_profile(text);
create function public.member_profile(p_username text)
returns table (
  username text, display_name text, bio text, joined_at timestamptz,
  followers integer, following integer, viewer_follows boolean, is_self boolean,
  loves integer, notes integer, gifts integer, avatar_path text
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
    c.loves, c.notes, c.gifts, p.avatar_path
  from public.profiles p
  cross join lateral public.member_experience_counts(p.id) c
  where p.username = lower(btrim(p_username));
$$;
revoke all on function public.member_profile(text) from public;
grant execute on function public.member_profile(text) to anonymous, authenticated;

drop function public.search_members(text, integer);
create function public.search_members(p_query text, p_limit integer default 20)
returns table (username text, display_name text, bio text, followers integer, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  with term as (
    -- Literal matching: the user's %, _ and \ are not wildcards.
    select replace(replace(replace(lower(btrim(ltrim(coalesce(p_query, ''), '@'))), '\', '\\'), '%', '\%'), '_', '\_') as q
  )
  select p.username, p.display_name, p.bio,
    (select count(*)::integer from public.follows where followee_id = p.id),
    p.avatar_path
  from public.profiles p, term
  where p.username is not null and length(term.q) >= 2
    and (p.username like term.q || '%' or lower(coalesce(p.display_name, '')) like '%' || term.q || '%')
  order by (p.username = term.q) desc, (p.username like term.q || '%') desc, p.username
  limit least(greatest(coalesce(p_limit, 20), 1), 40);
$$;
revoke all on function public.search_members(text, integer) from public;
grant execute on function public.search_members(text, integer) to anonymous, authenticated;

-- Follower and following lists, newest first. Signed-in members only: guests
-- still see the totals on a profile, but not the names behind them.
create function public.member_follow_list(p_username text, p_direction text, p_limit integer default 50, p_before timestamptz default null)
returns table (username text, display_name text, avatar_path text, followed_at timestamptz, viewer_follows boolean, is_self boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if public.current_member_id() is null then
    raise exception 'authentication required';
  end if;
  if p_direction not in ('followers', 'following') then
    raise exception 'invalid direction';
  end if;
  select id into target from public.profiles where profiles.username = lower(btrim(p_username));
  if target is null then
    return;
  end if;
  return query
    select p.username, p.display_name, p.avatar_path, f.created_at,
      exists (select 1 from public.follows v where v.follower_id = public.current_member_id() and v.followee_id = p.id),
      p.id = public.current_member_id()
    from public.follows f
    join public.profiles p on p.id = case when p_direction = 'followers' then f.follower_id else f.followee_id end
    where (case when p_direction = 'followers' then f.followee_id else f.follower_id end) = target
      and p.username is not null
      and (p_before is null or f.created_at < p_before)
    order by f.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;
revoke all on function public.member_follow_list(text, text, integer, timestamptz) from public, anonymous;
grant execute on function public.member_follow_list(text, text, integer, timestamptz) to authenticated;

commit;
