begin;

-- Members have an @username and a public profile, and can follow each other.
-- A profile shows the member's name, bio, level and the published stories they
-- did not post anonymously; those stories are already public after review.

-- The viewer's account id, or null for guests, whose token subject is not one.
create or replace function public.current_member_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case when auth.user_id() ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then auth.user_id()::uuid end;
$$;
grant execute on function public.current_member_id() to anonymous, authenticated;

-- Usernames ------------------------------------------------------------------

alter table public.profiles
  add column username text,
  add column bio text check (bio is null or length(bio) <= 160),
  add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,20}$'),
  add constraint profiles_username_unique unique (username);

-- Every profile is now public by username, so the opt-in handle from 011 goes.
drop function public.public_member_profile(text);
alter table public.profiles drop column level_public, drop column public_handle;
revoke update on public.profiles from authenticated;
grant update (display_name, bio) on public.profiles to authenticated;

create or replace function public.claim_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(btrim(coalesce(p_username, '')));
begin
  if auth.user_id()::uuid is null then
    raise exception 'authentication required';
  end if;
  if wanted !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid username';
  end if;
  if wanted = any(array[
    'admin', 'administrator', 'api', 'account', 'auth', 'help', 'home', 'humanhere', 'human_here',
    'humans', 'login', 'logout', 'members', 'mission', 'moderator', 'privacy', 'root', 'settings',
    'share', 'staff', 'support', 'system', 'terms', 'welcome', 'world'
  ]) then
    raise exception 'username is reserved';
  end if;
  if exists (select 1 from public.profiles where username = wanted and id <> auth.user_id()::uuid) then
    raise exception 'username is taken';
  end if;
  update public.profiles set username = wanted where id = auth.user_id()::uuid;
  return wanted;
end;
$$;
revoke all on function public.claim_username(text) from public, anonymous;
grant execute on function public.claim_username(text) to authenticated;

-- Follows --------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id, created_at desc);

alter table public.follows enable row level security;
create policy follows_read_own on public.follows for select to authenticated
  using (follower_id = auth.user_id()::uuid or followee_id = auth.user_id()::uuid);
revoke all on public.follows from anonymous, authenticated;
grant select on public.follows to authenticated;

create or replace function public.follow_member(p_username text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if auth.user_id()::uuid is null then
    raise exception 'authentication required';
  end if;
  select id into target from public.profiles where username = lower(btrim(p_username));
  if target is null or target = auth.user_id()::uuid then
    raise exception 'member not found';
  end if;
  insert into public.follows (follower_id, followee_id) values (auth.user_id()::uuid, target)
  on conflict do nothing;
  return true;
end;
$$;

create or replace function public.unfollow_member(p_username text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.follows
    where follower_id = auth.user_id()::uuid
      and followee_id = (select id from public.profiles where username = lower(btrim(p_username)))
    returning 1
  )
  select exists (select 1 from removed);
$$;

revoke all on function public.follow_member(text) from public, anonymous;
revoke all on function public.unfollow_member(text) from public, anonymous;
grant execute on function public.follow_member(text) to authenticated;
grant execute on function public.unfollow_member(text) to authenticated;

-- Profiles and stories ------------------------------------------------------------

-- A story's author username, never for an anonymous story. It takes the entry
-- id so visitors never need to read the author's account id.
create or replace function public.entry_author_username(p_human_entry_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.username from public.human_entries h join public.profiles p on p.id = h.subject_user_id
  where h.id = p_human_entry_id and not h.anonymous;
$$;
revoke all on function public.entry_author_username(uuid) from public;
grant execute on function public.entry_author_username(uuid) to anonymous, authenticated;

create or replace view public.human_entries_public
with (security_invoker = true)
as
select
  id, slug, type, source, first_name, display_location, anonymous,
  thumbnail, media, headline, quote, story, featured, layout, love_count,
  allow_private_notes, social_image_allowed, created_at, published_at,
  public_latitude, public_longitude, public_location_precision,
  public.entry_author_username(id) as author_username
from public.human_entries
where published = true
  and published_at is not null
  and (source = 'editorial' or consent_verified = true);
grant select on public.human_entries_public to anonymous, authenticated;

create or replace function public.member_profile(p_username text)
returns table (
  username text, display_name text, bio text, joined_at timestamptz,
  followers integer, following integer, viewer_follows boolean, is_self boolean,
  loves integer, notes integer, gifts integer
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
    c.loves, c.notes, c.gifts
  from public.profiles p
  cross join lateral public.member_experience_counts(p.id) c
  where p.username = lower(btrim(p_username));
$$;
revoke all on function public.member_profile(text) from public;
grant execute on function public.member_profile(text) to anonymous, authenticated;

create or replace function public.followed_usernames()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select p.username from public.follows f join public.profiles p on p.id = f.followee_id
  where f.follower_id = auth.user_id()::uuid and p.username is not null;
$$;
revoke all on function public.followed_usernames() from public, anonymous;
grant execute on function public.followed_usernames() to authenticated;

-- Published, non-anonymous stories by the people the member follows.
create or replace function public.following_feed(p_limit integer default 30, p_before timestamptz default null)
returns setof public.human_entries_public
language sql
stable
security invoker
set search_path = ''
as $$
  select v.* from public.human_entries_public v
  where v.author_username in (select public.followed_usernames())
    and (p_before is null or v.published_at < p_before)
  order by v.published_at desc, v.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 60);
$$;
revoke all on function public.following_feed(integer, timestamptz) from public, anonymous;
grant execute on function public.following_feed(integer, timestamptz) to authenticated;

-- Reports ---------------------------------------------------------------------------

create type public.report_reason as enum (
  'harassment', 'hate', 'private_information', 'sexual_content', 'violence', 'self_harm',
  'minor_safety', 'spam', 'impersonation', 'other'
);
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid not null references public.human_entries(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or length(details) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution text check (resolution is null or resolution in ('removed', 'dismissed'))
);
create index content_reports_open_idx on public.content_reports (created_at) where resolved_at is null;
create index content_reports_reporter_idx on public.content_reports (reporter_id, created_at desc);

alter table public.content_reports enable row level security;
create policy content_reports_staff_read on public.content_reports for select to authenticated using (public.is_staff());
create policy content_reports_staff_resolve on public.content_reports for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke all on public.content_reports from anonymous, authenticated;
grant select on public.content_reports to authenticated;
grant update (resolved_at, resolved_by, resolution) on public.content_reports to authenticated;

create or replace function public.report_content(p_human_entry_id uuid, p_reason public.report_reason, p_details text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_id uuid;
begin
  if auth.user_id()::uuid is null then
    raise exception 'authentication required';
  end if;
  if (select count(*) from public.content_reports
      where reporter_id = auth.user_id()::uuid and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'report limit reached';
  end if;
  if not exists (select 1 from public.human_entries where id = p_human_entry_id and published = true) then
    raise exception 'story not found';
  end if;
  insert into public.content_reports (human_entry_id, reporter_id, reason, details)
  values (p_human_entry_id, auth.user_id()::uuid, p_reason, nullif(left(btrim(coalesce(p_details, '')), 1000), ''))
  returning id into report_id;
  return report_id;
end;
$$;
revoke all on function public.report_content(uuid, public.report_reason, text) from public, anonymous;
grant execute on function public.report_content(uuid, public.report_reason, text) to authenticated;

commit;
