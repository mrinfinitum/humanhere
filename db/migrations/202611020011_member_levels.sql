begin;

-- Members earn experience by showing love, writing notes that moderators
-- approve, and giving. Experience is counted from those records rather than
-- stored, so un-loving a story or a refunded gift takes it back and nothing
-- can be earned twice. Points per action and rank names live in the app.

-- A confirmed gift. Rows are written only by the server once the donation
-- processor confirms a payment; amounts stay with the processor, because
-- experience is the same for every gift.
create type public.member_gift_status as enum ('succeeded', 'refunded');
create table public.member_gifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null check (length(btrim(provider)) between 1 and 40),
  provider_reference text not null check (length(btrim(provider_reference)) between 1 and 200),
  status public.member_gift_status not null default 'succeeded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_gifts_provider_reference_unique unique (provider, provider_reference)
);
create index member_gifts_user_idx on public.member_gifts (user_id, created_at desc) where status = 'succeeded';
create trigger member_gifts_set_updated_at before update on public.member_gifts
  for each row execute function public.set_updated_at();

alter table public.member_gifts enable row level security;
create policy member_gifts_read_self on public.member_gifts for select to authenticated
  using (user_id = auth.user_id()::uuid);
create policy member_gifts_read_staff on public.member_gifts for select to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]));
revoke all on public.member_gifts from anonymous, authenticated;
grant select on public.member_gifts to authenticated;

-- A public profile shows only a member's name, level and rank, never their
-- stories, loves or notes. It is off until the member turns it on, and its
-- address is a random handle rather than the account ID.
alter table public.profiles
  add column level_public boolean not null default false,
  add column public_handle text not null default substr(md5(gen_random_uuid()::text), 1, 12);
alter table public.profiles add constraint profiles_public_handle_unique unique (public_handle);
grant update (level_public) on public.profiles to authenticated;

-- Loves on a member's own stories do not count.
create or replace function public.member_experience_counts(p_user_id uuid)
returns table (loves integer, notes integer, gifts integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from public.human_entry_loves l
      join public.human_entries h on h.id = l.human_entry_id
      where l.user_id = p_user_id and h.subject_user_id is distinct from p_user_id),
    (select count(*)::integer from public.human_entry_notes n
      where n.sender_user_id = p_user_id and n.moderation_status = 'approved'),
    (select count(*)::integer from public.member_gifts g
      where g.user_id = p_user_id and g.status = 'succeeded');
$$;
revoke all on function public.member_experience_counts(uuid) from public, anonymous, authenticated;

create or replace function public.my_experience()
returns table (loves integer, notes integer, gifts integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.user_id()::uuid is null then
    raise exception 'authentication required';
  end if;
  return query select * from public.member_experience_counts(auth.user_id()::uuid);
end;
$$;
revoke all on function public.my_experience() from public, anonymous;
grant execute on function public.my_experience() to authenticated;

create or replace function public.public_member_profile(p_handle text)
returns table (display_name text, joined_at timestamptz, loves integer, notes integer, gifts integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, p.created_at, c.loves, c.notes, c.gifts
  from public.profiles p
  cross join lateral public.member_experience_counts(p.id) c
  where p.public_handle = p_handle and p.level_public = true;
$$;
revoke all on function public.public_member_profile(text) from public;
grant execute on function public.public_member_profile(text) to anonymous, authenticated;

commit;
