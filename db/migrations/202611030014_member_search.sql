begin;

-- Anyone can look members up by @username or name, without signing in.
-- Only members who have picked a username appear, and only what their public
-- profile already shows.
create index profiles_username_prefix_idx on public.profiles (username text_pattern_ops) where username is not null;

create or replace function public.search_members(p_query text, p_limit integer default 20)
returns table (username text, display_name text, bio text, followers integer)
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
    (select count(*)::integer from public.follows where followee_id = p.id)
  from public.profiles p, term
  where p.username is not null and length(term.q) >= 2
    and (p.username like term.q || '%' or lower(coalesce(p.display_name, '')) like '%' || term.q || '%')
  order by (p.username = term.q) desc, (p.username like term.q || '%') desc, p.username
  limit least(greatest(coalesce(p_limit, 20), 1), 40);
$$;
revoke all on function public.search_members(text, integer) from public;
grant execute on function public.search_members(text, integer) to anonymous, authenticated;

commit;
