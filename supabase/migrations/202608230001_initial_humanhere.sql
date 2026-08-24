begin;

create extension if not exists pgcrypto with schema extensions;

create type public.account_role as enum ('user', 'moderator', 'editor', 'admin');
create type public.human_entry_type as enum ('portrait', 'story', 'note', 'video', 'audio', 'object', 'place', 'quote');
create type public.human_entry_source as enum ('direct', 'editorial', 'social');
create type public.submission_status as enum ('draft', 'submitted', 'in_review', 'contacted', 'approved', 'rejected', 'published', 'archived');
create type public.submission_media_type as enum ('image', 'video', 'audio', 'note', 'document');
create type public.share_intent as enum ('share_story', 'need_help', 'help_someone', 'explore');
create type public.identity_mode as enum ('full_name', 'first_name', 'anonymous');
create type public.need_category as enum ('housing', 'food', 'safety', 'family', 'grief', 'recovery', 'employment', 'financial', 'loneliness', 'parenting', 'faith', 'health', 'transportation', 'other');
create type public.help_preference as enum ('share_only', 'prayer', 'practical_help', 'resources', 'contact_me', 'help_someone');
create type public.moderation_flag_type as enum ('nudity', 'sexual_content', 'graphic_violence', 'hate_or_harassment', 'self_harm', 'threats', 'doxxing', 'visible_private_information', 'minor', 'domestic_violence', 'medical_content', 'substance_use', 'illegal_activity', 'accusation_against_person', 'spam', 'commercial_promotion', 'copyright_concern', 'consent_unclear', 'other');
create type public.editorial_tier as enum ('GREEN', 'YELLOW', 'RED');
create type public.social_moderation_status as enum ('discovered', 'screened', 'needs_review', 'approved_for_contact', 'rejected');
create type public.social_consent_status as enum ('not_requested', 'requested', 'received', 'declined', 'revoked');
create type public.social_editorial_status as enum ('pending', 'approved', 'rejected', 'converted');
create type public.removal_status as enum ('pending', 'verifying', 'approved', 'rejected', 'resolved');
create type public.referral_status as enum ('requested', 'reviewing', 'referred', 'closed', 'declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) <= 160),
  role public.account_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.human_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type public.human_entry_type not null,
  source public.human_entry_source not null,
  public_name text check (public_name is null or length(public_name) <= 160),
  first_name text check (first_name is null or length(first_name) <= 80),
  age smallint check (age is null or age between 0 and 125),
  display_location text check (display_location is null or length(display_location) <= 160),
  anonymous boolean not null default false,
  thumbnail jsonb check (thumbnail is null or (jsonb_typeof(thumbnail) = 'object' and thumbnail ?& array['id', 'provider', 'path', 'alt', 'mimeType', 'kind'])),
  media jsonb check (media is null or jsonb_typeof(media) = 'array'),
  headline text check (headline is null or length(headline) <= 300),
  quote text check (quote is null or length(quote) <= 2000),
  story text check (story is null or length(story) <= 50000),
  featured boolean not null default false,
  layout jsonb,
  source_platform text,
  source_url text,
  submission_id uuid,
  social_discovery_post_id uuid,
  subject_user_id uuid references auth.users(id) on delete set null,
  consent_verified boolean not null default false,
  is_minor boolean not null default false,
  guardian_consent_verified boolean not null default false,
  sensitive_story boolean not null default false,
  location_withheld boolean not null default false,
  media_withheld boolean not null default false,
  publish_after timestamptz,
  allow_private_notes boolean not null default false,
  social_image_allowed boolean not null default false,
  love_count bigint not null default 0 check (love_count >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint published_requires_date check (not published or published_at is not null),
  constraint sourced_content_requires_consent check (not published or source = 'editorial' or consent_verified),
  constraint minors_require_guardian_consent check (not published or not is_minor or guardian_consent_verified),
  constraint withheld_location_is_private check (not location_withheld or display_location is null),
  constraint withheld_media_is_private check (not media_withheld or (thumbnail is null and media is null))
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent public.share_intent,
  artifact_type public.human_entry_type,
  identity_mode public.identity_mode,
  public_name text check (public_name is null or length(public_name) <= 160),
  anonymous boolean not null default false,
  location text check (location is null or length(location) <= 160),
  headline text check (headline is null or length(headline) <= 300),
  story text check (story is null or length(story) <= 50000),
  what_they_need public.help_preference[],
  need_category public.need_category,
  is_minor boolean not null default false,
  guardian_consent_verified boolean not null default false,
  location_withheld boolean not null default false,
  media_withheld boolean not null default false,
  requested_publish_after timestamptz,
  allow_private_notes boolean not null default false,
  status public.submission_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint submitted_requires_date check (status = 'draft' or submitted_at is not null),
  constraint submissions_id_user_unique unique (id, user_id)
);

create table public.submission_media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  media_type public.submission_media_type not null,
  storage_provider text not null default 'supabase',
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds between 0 and 600),
  blur_data_url text,
  caption text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.social_discovery_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  platform_post_id text,
  source_url text not null check (length(source_url) <= 2048),
  author_username text,
  author_display_name text,
  caption text,
  media_type public.human_entry_type,
  thumbnail_path text,
  discovered_at timestamptz not null default now(),
  moderation_status public.social_moderation_status not null default 'discovered',
  consent_status public.social_consent_status not null default 'not_requested',
  editorial_status public.social_editorial_status not null default 'pending',
  linked_human_entry_id uuid references public.human_entries(id) on delete set null,
  internal_notes text check (internal_notes is null or length(internal_notes) <= 10000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_post_id)
);

alter table public.human_entries
  add constraint human_entries_submission_id_fkey foreign key (submission_id) references public.submissions(id) on delete set null,
  add constraint human_entries_social_discovery_post_id_fkey foreign key (social_discovery_post_id) references public.social_discovery_posts(id) on delete set null;

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  social_discovery_post_id uuid references public.social_discovery_posts(id) on delete cascade,
  flag public.moderation_flag_type not null,
  tier public.editorial_tier not null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint moderation_flag_one_target check (num_nonnulls(submission_id, social_discovery_post_id) = 1)
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  publish_story boolean not null default false,
  publish_media boolean not null default false,
  social_reuse boolean not null default false,
  may_contact boolean not null default false,
  partner_referral boolean not null default false,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_owner_matches_submission foreign key (submission_id, user_id) references public.submissions(id, user_id) on delete cascade
);

create table public.removal_requests (
  id uuid primary key default gen_random_uuid(),
  human_entry_id uuid references public.human_entries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  requester_name text not null check (length(requester_name) <= 160),
  requester_email text not null check (length(requester_email) <= 320),
  reason text not null check (length(reason) <= 500),
  message text check (message is null or length(message) <= 5000),
  status public.removal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create table public.partner_referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  need_category public.need_category not null,
  private_notes text,
  referral_status public.referral_status not null default 'requested',
  partner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index human_entries_public_cursor_idx on public.human_entries (published_at desc, id desc)
  where published = true and (source = 'editorial' or consent_verified = true);
create index human_entries_public_type_cursor_idx on public.human_entries (type, published_at desc, id desc)
  where published = true and (source = 'editorial' or consent_verified = true);
create index human_entries_featured_cursor_idx on public.human_entries (published_at desc, id desc)
  where published = true and featured = true and (source = 'editorial' or consent_verified = true);
create index human_entries_source_idx on public.human_entries (source, created_at desc);
create unique index human_entries_submission_unique_idx on public.human_entries (submission_id) where submission_id is not null;
create unique index human_entries_social_unique_idx on public.human_entries (social_discovery_post_id) where social_discovery_post_id is not null;
create index submissions_owner_cursor_idx on public.submissions (user_id, created_at desc, id desc);
create index submissions_status_cursor_idx on public.submissions (status, created_at asc, id asc);
create index submission_media_submission_order_idx on public.submission_media (submission_id, sort_order, id);
create index social_moderation_cursor_idx on public.social_discovery_posts (moderation_status, created_at asc, id asc);
create index social_editorial_cursor_idx on public.social_discovery_posts (editorial_status, consent_status, created_at asc, id asc);
create unique index social_manual_active_source_unique_idx
  on public.social_discovery_posts (platform, lower(rtrim(btrim(source_url), '/')))
  where platform_post_id is null and editorial_status in ('pending', 'approved');
create index consent_submission_created_idx on public.consent_records (submission_id, created_at desc, id desc);
create index moderation_submission_idx on public.moderation_flags (submission_id, created_at desc) where submission_id is not null;
create index moderation_social_idx on public.moderation_flags (social_discovery_post_id, created_at desc) where social_discovery_post_id is not null;
create index removal_status_cursor_idx on public.removal_requests (status, created_at asc, id asc);
create index referral_status_cursor_idx on public.partner_referrals (referral_status, created_at asc, id asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger human_entries_updated_at before update on public.human_entries for each row execute function public.set_updated_at();
create trigger submissions_updated_at before update on public.submissions for each row execute function public.set_updated_at();
create trigger social_posts_updated_at before update on public.social_discovery_posts for each row execute function public.set_updated_at();
create trigger consent_updated_at before update on public.consent_records for each row execute function public.set_updated_at();
create trigger referrals_updated_at before update on public.partner_referrals for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_account_role()
returns public.account_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user'::public.account_role);
$$;

create or replace function public.is_staff(allowed public.account_role[] default array['moderator', 'editor', 'admin']::public.account_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_account_role() = any(allowed);
$$;

revoke all on function public.current_account_role() from public;
revoke all on function public.is_staff(public.account_role[]) from public;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.current_account_role() from anon;
revoke all on function public.is_staff(public.account_role[]) from anon;
grant execute on function public.current_account_role() to authenticated;
grant execute on function public.is_staff(public.account_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.human_entries enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_media enable row level security;
alter table public.social_discovery_posts enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.consent_records enable row level security;
alter table public.removal_requests enable row level security;
alter table public.partner_referrals enable row level security;

create policy profiles_read_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_read_staff on public.profiles for select to authenticated using (public.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_manage_admin on public.profiles for all to authenticated using (public.is_staff(array['admin']::public.account_role[])) with check (public.is_staff(array['admin']::public.account_role[]));

create policy humans_public_read on public.human_entries for select to anon, authenticated
  using (published = true and (source = 'editorial' or consent_verified = true));
create policy humans_staff_read on public.human_entries for select to authenticated using (public.is_staff());
create policy humans_editor_insert on public.human_entries for insert to authenticated
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));
create policy humans_editor_update on public.human_entries for update to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));
create policy humans_admin_delete on public.human_entries for delete to authenticated
  using (public.is_staff(array['admin']::public.account_role[]));

create policy submissions_create_own_draft on public.submissions for insert to authenticated
  with check (user_id = auth.uid() and status = 'draft');
create policy submissions_read_own on public.submissions for select to authenticated using (user_id = auth.uid());
create policy submissions_update_own_draft on public.submissions for update to authenticated
  using (user_id = auth.uid() and status = 'draft')
  with check (user_id = auth.uid() and status in ('draft', 'submitted'));
create policy submissions_staff_all on public.submissions for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy media_read_own on public.submission_media for select to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid()));
create policy media_insert_own_draft on public.submission_media for insert to authenticated
  with check (exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid() and s.status = 'draft'));
create policy media_update_own_draft on public.submission_media for update to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid() and s.status = 'draft'))
  with check (exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid() and s.status = 'draft'));
create policy media_delete_own_draft on public.submission_media for delete to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid() and s.status = 'draft'));
create policy media_staff_all on public.submission_media for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy social_staff_only on public.social_discovery_posts for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy moderation_staff_only on public.moderation_flags for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy consent_read_own on public.consent_records for select to authenticated using (user_id = auth.uid());
create policy consent_insert_own on public.consent_records for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid()));
create policy consent_staff_read on public.consent_records for select to authenticated using (public.is_staff());
create policy consent_staff_manage on public.consent_records for all to authenticated
  using (public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (public.is_staff(array['editor', 'admin']::public.account_role[]));

create policy removal_create_own on public.removal_requests for insert to authenticated with check (user_id = auth.uid());
create policy removal_read_own on public.removal_requests for select to authenticated using (user_id = auth.uid());
create policy removal_staff_all on public.removal_requests for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy referrals_read_own on public.partner_referrals for select to authenticated using (user_id = auth.uid());
create policy referrals_create_own on public.partner_referrals for insert to authenticated
  with check (user_id = auth.uid() and (submission_id is null or exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())));
create policy referrals_staff_all on public.partner_referrals for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.consent_records from anon, authenticated;
grant select on public.consent_records to authenticated;
grant insert (submission_id, user_id, publish_story, publish_media, social_reuse, may_contact, partner_referral, consented_at)
  on public.consent_records to authenticated;

revoke all on public.removal_requests from anon, authenticated;
grant select on public.removal_requests to authenticated;
grant insert (human_entry_id, user_id, requester_name, requester_email, reason, message)
  on public.removal_requests to authenticated;

revoke all on public.partner_referrals from anon, authenticated;
grant select on public.partner_referrals to authenticated;
grant insert (user_id, submission_id, need_category, private_notes)
  on public.partner_referrals to authenticated;

revoke all on public.human_entries from anon, authenticated;
grant select (
  id, slug, type, source, first_name, display_location, anonymous, thumbnail, media,
  headline, quote, story, featured, layout, created_at, published_at, published, consent_verified,
  love_count, allow_private_notes, social_image_allowed
) on public.human_entries to anon, authenticated;

revoke all on public.submissions from anon, authenticated;
grant select on public.submissions to authenticated;
grant insert (
  user_id, intent, artifact_type, identity_mode, public_name, anonymous, location,
  headline, story, what_they_need, need_category, is_minor, location_withheld,
  media_withheld, requested_publish_after, allow_private_notes
) on public.submissions to authenticated;
grant update (
  intent, artifact_type, identity_mode, public_name, anonymous, location, headline,
  story, what_they_need, need_category, is_minor, location_withheld, media_withheld,
  requested_publish_after, allow_private_notes, status, submitted_at
) on public.submissions to authenticated;

revoke all on public.submission_media from anon, authenticated;
grant select, insert, update, delete on public.submission_media to authenticated;

create or replace view public.human_entries_public
with (security_invoker = true)
as
select
  id, slug, type, source, first_name, display_location, anonymous,
  thumbnail, media, headline, quote, story, featured, layout, love_count,
  allow_private_notes, social_image_allowed, created_at, published_at
from public.human_entries
where published = true
  and published_at is not null
  and (source = 'editorial' or consent_verified = true);

grant select on public.human_entries_public to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('submission-private', 'submission-private', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'video/mp4', 'video/quicktime', 'application/pdf']),
  ('social-review-private', 'social-review-private', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('published-media', 'published-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'video/mp4'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy storage_submission_read_own on storage.objects for select to authenticated
  using (
    bucket_id = 'submission-private'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.submissions s
      where s.id::text = (storage.foldername(name))[2] and s.user_id = auth.uid()
    )
  );
create policy storage_submission_upload_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submission-private'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.submissions s
      where s.user_id = auth.uid() and s.status = 'draft'
        and s.id::text = (storage.foldername(name))[2]
    )
  );
create policy storage_submission_update_own on storage.objects for update to authenticated
  using (
    bucket_id = 'submission-private'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.submissions s
      where s.id::text = (storage.foldername(name))[2] and s.user_id = auth.uid() and s.status = 'draft'
    )
  )
  with check (
    bucket_id = 'submission-private'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.submissions s
      where s.id::text = (storage.foldername(name))[2] and s.user_id = auth.uid() and s.status = 'draft'
    )
  );
create policy storage_submission_delete_own on storage.objects for delete to authenticated
  using (
    bucket_id = 'submission-private'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.submissions s
      where s.id::text = (storage.foldername(name))[2] and s.user_id = auth.uid() and s.status = 'draft'
    )
  );
create policy storage_submission_staff_review on storage.objects for select to authenticated
  using (bucket_id = 'submission-private' and public.is_staff());
create policy storage_social_staff on storage.objects for all to authenticated
  using (bucket_id = 'social-review-private' and public.is_staff())
  with check (bucket_id = 'social-review-private' and public.is_staff());
create policy storage_published_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'published-media');
create policy storage_published_editor_write on storage.objects for all to authenticated
  using (bucket_id = 'published-media' and public.is_staff(array['editor', 'admin']::public.account_role[]))
  with check (bucket_id = 'published-media' and public.is_staff(array['editor', 'admin']::public.account_role[]));

comment on view public.human_entries_public is 'Public-safe, consent-aware projection. Never join submissions, contact details, consent evidence, moderation notes, or referrals into this view.';
comment on column public.submission_media.storage_path is 'Private object key. Expose only short-lived signed URLs to the owner or staff.';
comment on table public.social_discovery_posts is 'Private discovery queue. Hashtag use is never consent to republish.';

commit;
