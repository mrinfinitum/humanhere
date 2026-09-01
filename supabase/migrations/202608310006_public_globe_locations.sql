begin;

create type public.human_public_location_precision as enum ('city', 'region', 'country');

alter table public.human_entries
  add column public_latitude numeric(8, 5),
  add column public_longitude numeric(8, 5),
  add column public_location_precision public.human_public_location_precision,
  add column public_location_approved_at timestamptz,
  add column public_location_approved_by uuid references auth.users(id) on delete set null,
  add constraint human_entries_public_latitude_range check (
    public_latitude is null or public_latitude between -90 and 90
  ),
  add constraint human_entries_public_longitude_range check (
    public_longitude is null or public_longitude between -180 and 180
  ),
  add constraint human_entries_public_location_complete check (
    num_nonnulls(
      public_latitude,
      public_longitude,
      public_location_precision,
      public_location_approved_at
    ) in (0, 4)
    and (public_location_approved_by is null or public_location_approved_at is not null)
  ),
  add constraint human_entries_withheld_location_has_no_coordinates check (
    not location_withheld or (
      public_latitude is null
      and public_longitude is null
      and public_location_precision is null
      and public_location_approved_at is null
      and public_location_approved_by is null
    )
  );

create index human_entries_globe_cursor_idx
  on public.human_entries (published_at desc, id desc)
  where published = true
    and public_latitude is not null
    and public_longitude is not null
    and (source = 'editorial' or consent_verified = true);

create or replace function public.set_human_entry_public_location(
  p_human_entry_id uuid,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_precision public.human_public_location_precision default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry public.human_entries%rowtype;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;

  select * into entry
  from public.human_entries
  where id = p_human_entry_id
  for update;

  if not found then
    raise exception 'human entry not found';
  end if;

  if p_latitude is null and p_longitude is null and p_precision is null then
    update public.human_entries
    set public_latitude = null,
        public_longitude = null,
        public_location_precision = null,
        public_location_approved_at = null,
        public_location_approved_by = null
    where id = p_human_entry_id;
    return entry.slug;
  end if;

  if p_latitude is null or p_longitude is null or p_precision is null then
    raise exception 'public latitude, longitude, and precision are all required';
  end if;
  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'public coordinates are outside valid bounds';
  end if;
  if entry.location_withheld or nullif(btrim(coalesce(entry.display_location, '')), '') is null then
    raise exception 'public location is withheld';
  end if;

  update public.human_entries
  set public_latitude = p_latitude,
      public_longitude = p_longitude,
      public_location_precision = p_precision,
      public_location_approved_at = now(),
      public_location_approved_by = auth.uid()
  where id = p_human_entry_id;

  return entry.slug;
end;
$$;

create or replace function public.publish_submission_with_location(
  p_submission_id uuid,
  p_slug text,
  p_thumbnail jsonb,
  p_media jsonb default null,
  p_type public.human_entry_type default 'story',
  p_layout jsonb default null,
  p_sensitive_story boolean default false,
  p_public_latitude numeric default null,
  p_public_longitude numeric default null,
  p_public_location_precision public.human_public_location_precision default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_id uuid;
begin
  if not public.is_staff(array['editor', 'admin']::public.account_role[]) then
    raise exception 'not authorized';
  end if;

  entry_id := public.publish_submission(
    p_submission_id,
    p_slug,
    p_thumbnail,
    p_media,
    p_type,
    p_layout,
    p_sensitive_story
  );

  if p_public_latitude is not null
     or p_public_longitude is not null
     or p_public_location_precision is not null then
    perform public.set_human_entry_public_location(
      entry_id,
      p_public_latitude,
      p_public_longitude,
      p_public_location_precision
    );
  end if;

  return entry_id;
end;
$$;

revoke all on function public.set_human_entry_public_location(uuid, numeric, numeric, public.human_public_location_precision) from public, anon;
revoke all on function public.publish_submission_with_location(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb, boolean, numeric, numeric, public.human_public_location_precision) from public, anon;
grant execute on function public.set_human_entry_public_location(uuid, numeric, numeric, public.human_public_location_precision) to authenticated;
grant execute on function public.publish_submission_with_location(uuid, text, jsonb, jsonb, public.human_entry_type, jsonb, boolean, numeric, numeric, public.human_public_location_precision) to authenticated;

grant select (public_latitude, public_longitude, public_location_precision)
  on public.human_entries to anon, authenticated;

create or replace view public.human_entries_public
with (security_invoker = true)
as
select
  id, slug, type, source, first_name, display_location, anonymous,
  thumbnail, media, headline, quote, story, featured, layout, love_count,
  allow_private_notes, social_image_allowed, created_at, published_at,
  public_latitude, public_longitude, public_location_precision
from public.human_entries
where published = true
  and published_at is not null
  and (source = 'editorial' or consent_verified = true);

grant select on public.human_entries_public to anon, authenticated;

comment on column public.human_entries.public_latitude is 'Editor-approved city/region/country centroid only. Never submitted GPS, EXIF, address, shelter, or home coordinates.';
comment on column public.human_entries.public_longitude is 'Editor-approved city/region/country centroid only. Never submitted GPS, EXIF, address, shelter, or home coordinates.';
comment on column public.human_entries.public_location_precision is 'Declares the safe approximation represented by the public coordinates.';
comment on function public.set_human_entry_public_location(uuid, numeric, numeric, public.human_public_location_precision) is 'Editor/admin-only boundary for approving or withholding globe coordinates.';
comment on view public.human_entries_public is 'Public-safe, consent-aware projection. Includes only editorially approved approximate globe coordinates; never joins private location, contact, consent, moderation, or fulfillment data.';

commit;
