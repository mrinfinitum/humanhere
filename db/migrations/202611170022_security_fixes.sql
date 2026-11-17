begin;

-- Fixes from the November 2026 security review.

-- 1. A story staff take down stays down. A takedown used to only unpublish
--    the entry, so its author could withdraw the story and post it again.
alter table public.human_entries
  add column removed_at timestamptz,
  add column removed_by uuid references public.profiles(id) on delete set null;

-- Any path that would republish a removed story fails. Staff restore one by
-- clearing removed_at in the same update.
create function public.keep_removed_entries_down()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.removed_at is not null and new.removed_at is not null and new.published then
    raise exception 'story was removed by staff';
  end if;
  return new;
end;
$$;
revoke all on function public.keep_removed_entries_down() from public, anonymous, authenticated;
create trigger human_entries_keep_removed_down before update on public.human_entries
  for each row execute function public.keep_removed_entries_down();

create or replace function public.unpublish_human_entry(p_human_entry_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_slug text;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;

  update public.human_entries
  set published = false, removed_at = now(), removed_by = auth.user_id()::uuid
  where id = p_human_entry_id and published = true
  returning slug into affected_slug;

  if affected_slug is null then
    raise exception 'published entry not found';
  end if;

  return affected_slug;
end;
$$;

-- 2. Publish only the text the server checked. The server reads the story,
--    runs the automatic check and copies media, which takes a moment; a member
--    could withdraw and rewrite the story in between. The server now passes
--    the text it checked, and publishing stops if the story differs.
-- 3. A story re-shared as anonymous gets a new link, because the old one
--    starts with the author's first name.
create function public.publish_checked_submission(
  p_user_id uuid,
  p_submission_id uuid,
  p_checked_headline text,
  p_checked_story text,
  p_checked_location text,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_public_latitude numeric default null,
  p_public_longitude numeric default null,
  p_public_location_precision public.human_public_location_precision default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_text record;
  previous public.human_entries%rowtype;
  had_entry boolean;
  published_slug text;
begin
  select headline, story, location into current_text from public.submissions
  where id = p_submission_id and user_id = p_user_id for update;
  if not found then
    raise exception 'submission is not publishable';
  end if;
  if current_text.headline is distinct from p_checked_headline
     or current_text.story is distinct from p_checked_story
     or current_text.location is distinct from p_checked_location then
    raise exception 'submission changed during publishing';
  end if;

  select * into previous from public.human_entries where submission_id = p_submission_id for update;
  had_entry := found;
  if had_entry and previous.removed_at is not null then
    raise exception 'story was removed by staff';
  end if;

  published_slug := public.self_publish_submission(
    p_user_id, p_submission_id, p_slug, p_thumbnail, p_media,
    p_public_latitude, p_public_longitude, p_public_location_precision
  );

  if had_entry and not previous.anonymous
     and (select anonymous from public.human_entries where id = previous.id) then
    update public.human_entries set slug = p_slug where id = previous.id;
    published_slug := p_slug;
  end if;
  return published_slug;
end;
$$;
revoke all on function public.publish_checked_submission(uuid, uuid, text, text, text, text, jsonb, jsonb, numeric, numeric, public.human_public_location_precision)
  from public, anonymous, authenticated;

-- 4. Members no longer register media rows themselves; the server does,
--    after checking the uploaded file. Captions become public alt text.
revoke insert on public.submission_media from authenticated;
alter table public.submission_media
  add constraint submission_media_caption_length check (caption is null or length(caption) <= 500) not valid;

-- 5. Moderators can still read every submission, but only editors and
--    admins can change or delete members' submissions and media.
drop policy submissions_staff_all on public.submissions;
create policy submissions_staff_read on public.submissions for select to authenticated using (public.is_staff());
create policy submissions_editor_write on public.submissions for all to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));
drop policy media_staff_all on public.submission_media;
create policy media_staff_read on public.submission_media for select to authenticated using (public.is_staff());
create policy media_editor_write on public.submission_media for all to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));

-- 6. Rate limits for the writes that had none. Each write is logged, so
--    deleting what was written (a draft, a follow) does not reset the count.
alter table public.member_rate_events drop constraint member_rate_events_action_check;
alter table public.member_rate_events add constraint member_rate_events_action_check
  check (action in ('love', 'draft', 'follow', 'username', 'removal', 'referral', 'consent', 'help_consent'));

create function public.count_rate_event(p_user_id uuid, p_action text, p_per_hour integer, p_per_day integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    return;
  end if;
  delete from public.member_rate_events
  where user_id = p_user_id and action = p_action and created_at < now() - interval '2 days';
  if (select count(*) from public.member_rate_events where user_id = p_user_id and action = p_action and created_at > now() - interval '1 hour') >= p_per_hour
     or (select count(*) from public.member_rate_events where user_id = p_user_id and action = p_action and created_at > now() - interval '1 day') >= p_per_day then
    raise exception '% limit reached', replace(p_action, '_', ' ');
  end if;
  insert into public.member_rate_events (user_id, action) values (p_user_id, p_action);
end;
$$;
revoke all on function public.count_rate_event(uuid, text, integer, integer) from public, anonymous, authenticated;

create or replace function public.limit_member_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'human_entry_loves' then
    perform public.count_rate_event(new.user_id, 'love', 60, 1000);
  elsif tg_table_name = 'human_entry_notes' then
    if (select count(*) from public.human_entry_notes where sender_user_id = new.sender_user_id and created_at > now() - interval '1 hour') >= 20
       or (select count(*) from public.human_entry_notes where sender_user_id = new.sender_user_id and created_at > now() - interval '1 day') >= 100 then
      raise exception 'note limit reached';
    end if;
  elsif tg_table_name = 'submissions' and tg_op = 'INSERT' then
    perform public.count_rate_event(new.user_id, 'draft', 10, 30);
  elsif tg_table_name = 'submissions' and tg_op = 'UPDATE' then
    -- Counted when a draft is shared; edits that reshare an existing story count too.
    if (select count(*) from public.submissions where user_id = new.user_id and id <> new.id and submitted_at > now() - interval '1 hour') >= 5
       or (select count(*) from public.submissions where user_id = new.user_id and id <> new.id and submitted_at > now() - interval '1 day') >= 15 then
      raise exception 'post limit reached';
    end if;
  elsif tg_table_name = 'follows' then
    perform public.count_rate_event(new.follower_id, 'follow', 60, 300);
  elsif tg_table_name = 'profiles' then
    perform public.count_rate_event(new.id, 'username', 5, 10);
  elsif tg_table_name = 'removal_requests' then
    perform public.count_rate_event(new.user_id, 'removal', 5, 10);
  elsif tg_table_name = 'partner_referrals' then
    perform public.count_rate_event(new.user_id, 'referral', 10, 30);
  elsif tg_table_name = 'consent_records' then
    perform public.count_rate_event(new.user_id, 'consent', 30, 100);
  elsif tg_table_name = 'help_consent_records' then
    perform public.count_rate_event(new.user_id, 'help_consent', 30, 100);
  end if;
  return new;
end;
$$;
revoke all on function public.limit_member_writes() from public, anonymous, authenticated;

create trigger follows_limit before insert on public.follows
  for each row execute function public.limit_member_writes();
create trigger profiles_username_limit before update of username on public.profiles
  for each row when (new.username is distinct from old.username and new.username is not null)
  execute function public.limit_member_writes();
create trigger removal_requests_limit before insert on public.removal_requests
  for each row execute function public.limit_member_writes();
create trigger partner_referrals_limit before insert on public.partner_referrals
  for each row execute function public.limit_member_writes();
create trigger consent_records_limit before insert on public.consent_records
  for each row execute function public.limit_member_writes();
create trigger help_consent_records_limit before insert on public.help_consent_records
  for each row execute function public.limit_member_writes();

commit;
