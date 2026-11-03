begin;

-- Stories now post instantly, so one account must not be able to flood the
-- site. These limits are enforced in the database, so they also hold for
-- requests sent straight to the Data API rather than through the app.
-- They are generous for a person and tight for a script.

create function public.limit_member_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'human_entry_loves' then
    if (select count(*) from public.human_entry_loves where user_id = new.user_id and created_at > now() - interval '1 hour') >= 60 then
      raise exception 'love limit reached';
    end if;
  elsif tg_table_name = 'human_entry_notes' then
    if (select count(*) from public.human_entry_notes where sender_user_id = new.sender_user_id and created_at > now() - interval '1 hour') >= 20
       or (select count(*) from public.human_entry_notes where sender_user_id = new.sender_user_id and created_at > now() - interval '1 day') >= 100 then
      raise exception 'note limit reached';
    end if;
  elsif tg_table_name = 'submissions' and tg_op = 'INSERT' then
    if (select count(*) from public.submissions where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10
       or (select count(*) from public.submissions where user_id = new.user_id and created_at > now() - interval '1 day') >= 30 then
      raise exception 'draft limit reached';
    end if;
  elsif tg_table_name = 'submissions' and tg_op = 'UPDATE' then
    -- Counted when a draft is shared; edits that reshare an existing story count too.
    if (select count(*) from public.submissions where user_id = new.user_id and id <> new.id and submitted_at > now() - interval '1 hour') >= 5
       or (select count(*) from public.submissions where user_id = new.user_id and id <> new.id and submitted_at > now() - interval '1 day') >= 15 then
      raise exception 'post limit reached';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.limit_member_writes() from public, anonymous, authenticated;

create trigger human_entry_loves_limit before insert on public.human_entry_loves
  for each row execute function public.limit_member_writes();
create trigger human_entry_notes_limit before insert on public.human_entry_notes
  for each row execute function public.limit_member_writes();
create trigger submissions_draft_limit before insert on public.submissions
  for each row execute function public.limit_member_writes();
create trigger submissions_post_limit before update of status on public.submissions
  for each row when (old.status = 'draft' and new.status = 'submitted')
  execute function public.limit_member_writes();

commit;
