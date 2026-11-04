begin;

-- The love limit counted the loves a member still has, so un-loving and
-- loving again reset it. Each love is now also written to an append-only
-- log, and the limit counts the log. Rows older than two days are pruned
-- as the member writes. The log is never readable through the Data API.

create table public.member_rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('love')),
  created_at timestamptz not null default now()
);
create index member_rate_events_user_action_idx on public.member_rate_events (user_id, action, created_at desc);
alter table public.member_rate_events enable row level security;
revoke all on public.member_rate_events from public, anonymous, authenticated;

create or replace function public.limit_member_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'human_entry_loves' then
    delete from public.member_rate_events
    where user_id = new.user_id and action = 'love' and created_at < now() - interval '2 days';
    if (select count(*) from public.member_rate_events where user_id = new.user_id and action = 'love' and created_at > now() - interval '1 hour') >= 60 then
      raise exception 'love limit reached';
    end if;
    insert into public.member_rate_events (user_id, action) values (new.user_id, 'love');
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

commit;
