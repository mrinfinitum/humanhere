begin;

create type public.human_share_platform as enum (
  'native', 'copy', 'facebook', 'x', 'linkedin', 'email', 'whatsapp', 'other'
);
create type public.human_note_moderation_status as enum ('pending', 'approved', 'flagged', 'rejected');
create type public.human_note_moderation_flag as enum (
  'threat', 'harassment', 'hate', 'sexual_content', 'doxxing', 'personal_information',
  'financial_solicitation', 'scam', 'off_platform_contact', 'dangerous_advice',
  'self_harm_concern', 'manipulation', 'spam', 'other'
);

alter table public.profiles
  add column notes_suspended_at timestamptz,
  add column notes_suspension_reason text check (
    notes_suspension_reason is null or length(notes_suspension_reason) <= 2000
  ),
  add column notes_suspended_by uuid references auth.users(id) on delete set null;

create table public.human_entry_loves (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid not null references public.human_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint human_entry_loves_one_per_user unique (human_entry_id, user_id)
);

create table public.human_entry_share_events (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid not null references public.human_entries(id) on delete cascade,
  platform public.human_share_platform not null,
  created_at timestamptz not null default now()
);

create table public.human_entry_notes (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid not null references public.human_entries(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  moderation_status public.human_note_moderation_status not null default 'pending',
  moderation_flags public.human_note_moderation_flag[] not null default '{}',
  moderation_notes text check (moderation_notes is null or length(moderation_notes) <= 5000),
  recipient_visible boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  read_at timestamptz,
  hidden_by_recipient_at timestamptz,
  reported_by_recipient_at timestamptz,
  constraint visible_note_must_be_approved check (
    not recipient_visible or (moderation_status = 'approved' and approved_at is not null)
  )
);

create index human_entry_loves_user_idx on public.human_entry_loves (user_id, human_entry_id);
create index human_entry_share_events_entry_idx on public.human_entry_share_events (human_entry_id, created_at desc);
create index human_entry_share_events_created_idx on public.human_entry_share_events (created_at desc);
create index human_entry_notes_moderation_idx on public.human_entry_notes (moderation_status, created_at asc, id asc);
create index human_entry_notes_recipient_idx on public.human_entry_notes (human_entry_id, created_at desc, id desc)
  where moderation_status = 'approved' and recipient_visible = true and hidden_by_recipient_at is null;
create index human_entry_notes_sender_idx on public.human_entry_notes (sender_user_id, created_at desc, id desc);

alter table public.human_entry_loves enable row level security;
alter table public.human_entry_share_events enable row level security;
alter table public.human_entry_notes enable row level security;

create policy loves_read_own on public.human_entry_loves for select to authenticated
  using (user_id = auth.uid());
create policy loves_insert_own_published on public.human_entry_loves for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.human_entries h
      where h.id = human_entry_id and h.published = true
        and (h.source = 'editorial' or h.consent_verified = true)
    )
  );
create policy loves_delete_own on public.human_entry_loves for delete to authenticated
  using (user_id = auth.uid());

create policy share_events_staff_read on public.human_entry_share_events for select to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]));

create policy notes_staff_read on public.human_entry_notes for select to authenticated
  using (public.is_staff(array['moderator', 'admin']::public.account_role[]));
create policy notes_staff_moderate on public.human_entry_notes for update to authenticated
  using (public.is_staff(array['moderator', 'admin']::public.account_role[]))
  with check (public.is_staff(array['moderator', 'admin']::public.account_role[]));
create policy notes_admin_delete on public.human_entry_notes for delete to authenticated
  using (public.is_staff(array['admin']::public.account_role[]));

revoke all on public.human_entry_loves from anon, authenticated;
grant select, insert, delete on public.human_entry_loves to authenticated;
revoke all on public.human_entry_share_events from anon, authenticated;
grant select on public.human_entry_share_events to authenticated;
revoke all on public.human_entry_notes from anon, authenticated;
grant select, update, delete on public.human_entry_notes to authenticated;

create or replace function public.sync_human_entry_love_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.human_entries set love_count = love_count + 1 where id = new.human_entry_id;
    return new;
  end if;

  update public.human_entries
  set love_count = greatest(love_count - 1, 0)
  where id = old.human_entry_id;
  return old;
end;
$$;

create trigger human_entry_love_count_insert
after insert on public.human_entry_loves
for each row execute function public.sync_human_entry_love_count();
create trigger human_entry_love_count_delete
after delete on public.human_entry_loves
for each row execute function public.sync_human_entry_love_count();

create or replace function public.submit_private_note(p_human_entry_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  note_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if nullif(btrim(coalesce(p_body, '')), '') is null or length(btrim(p_body)) > 2000 then
    raise exception 'note must contain between 1 and 2000 characters';
  end if;
  if exists (
    select 1 from public.profiles
    where id = auth.uid() and notes_suspended_at is not null
  ) then
    raise exception 'note sending is unavailable';
  end if;
  if not exists (
    select 1 from public.human_entries
    where id = p_human_entry_id and published = true and allow_private_notes = true
      and subject_user_id is not null and subject_user_id <> auth.uid()
      and (source = 'editorial' or consent_verified = true)
  ) then
    raise exception 'this story is not accepting notes';
  end if;

  insert into public.human_entry_notes (human_entry_id, sender_user_id, body)
  values (p_human_entry_id, auth.uid(), btrim(p_body))
  returning id into note_id;

  return note_id;
end;
$$;

create or replace function public.notes_for_me(
  p_limit integer default 40,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  note_id uuid,
  human_entry_id uuid,
  story_slug text,
  recipient_first_name text,
  body text,
  created_at timestamptz,
  read_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.human_entry_id, h.slug, h.first_name, n.body, n.created_at, n.read_at
  from public.human_entry_notes n
  join public.human_entries h on h.id = n.human_entry_id
  where auth.uid() is not null
    and h.subject_user_id = auth.uid()
    and n.moderation_status = 'approved'
    and n.recipient_visible = true
    and n.hidden_by_recipient_at is null
    and (
      p_before_created_at is null
      or (p_before_id is not null and (n.created_at, n.id) < (p_before_created_at, p_before_id))
    )
  order by n.created_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
$$;

create or replace function public.mark_private_note_read(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.human_entry_notes n
  set read_at = coalesce(n.read_at, now())
  from public.human_entries h
  where n.id = p_note_id and h.id = n.human_entry_id and h.subject_user_id = auth.uid()
    and n.moderation_status = 'approved' and n.recipient_visible = true
    and n.hidden_by_recipient_at is null;
  return found;
end;
$$;

create or replace function public.hide_private_note(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.human_entry_notes n
  set hidden_by_recipient_at = coalesce(n.hidden_by_recipient_at, now()), recipient_visible = false
  from public.human_entries h
  where n.id = p_note_id and h.id = n.human_entry_id and h.subject_user_id = auth.uid()
    and n.moderation_status = 'approved';
  return found;
end;
$$;

create or replace function public.report_private_note(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.human_entry_notes n
  set reported_by_recipient_at = coalesce(n.reported_by_recipient_at, now()),
      hidden_by_recipient_at = coalesce(n.hidden_by_recipient_at, now()),
      recipient_visible = false,
      moderation_status = 'flagged',
      moderation_flags = case
        when 'other'::public.human_note_moderation_flag = any(n.moderation_flags) then n.moderation_flags
        else array_append(n.moderation_flags, 'other'::public.human_note_moderation_flag)
      end
  from public.human_entries h
  where n.id = p_note_id and h.id = n.human_entry_id and h.subject_user_id = auth.uid()
    and n.moderation_status = 'approved';
  return found;
end;
$$;

revoke all on function public.sync_human_entry_love_count() from public, anon, authenticated;
revoke all on function public.submit_private_note(uuid, text) from public, anon;
revoke all on function public.notes_for_me(integer, timestamptz, uuid) from public, anon;
revoke all on function public.mark_private_note_read(uuid) from public, anon;
revoke all on function public.hide_private_note(uuid) from public, anon;
revoke all on function public.report_private_note(uuid) from public, anon;
grant execute on function public.submit_private_note(uuid, text) to authenticated;
grant execute on function public.notes_for_me(integer, timestamptz, uuid) to authenticated;
grant execute on function public.mark_private_note_read(uuid) to authenticated;
grant execute on function public.hide_private_note(uuid) to authenticated;
grant execute on function public.report_private_note(uuid) to authenticated;

comment on table public.human_entry_loves is 'Private reaction rows. Only the aggregate human_entries.love_count is public; never expose reactor lists.';
comment on table public.human_entry_share_events is 'Private share-intent analytics. Stores no recipient or social identity data.';
comment on table public.human_entry_notes is 'Private moderated encouragement. Recipient access must use notes_for_me(), which never returns sender identity.';

commit;
