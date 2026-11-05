-- entry_author_username is open to visitors, so it must not name the author of
-- a story that was taken down or unpublished.
create or replace function public.entry_author_username(p_human_entry_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.username from public.human_entries h join public.profiles p on p.id = h.subject_user_id
  where h.id = p_human_entry_id and h.published and not h.anonymous;
$$;
revoke all on function public.entry_author_username(uuid) from public;
grant execute on function public.entry_author_username(uuid) to anonymous, authenticated;
