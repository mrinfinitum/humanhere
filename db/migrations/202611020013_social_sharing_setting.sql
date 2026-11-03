begin;

-- The one sharing choice a member makes in their settings: whether HUMAN:HERE
-- may feature their stories on its own social media. It starts off. Photos
-- they add, and contact or partner help they ask for, come from the story.
alter table public.profiles add column allow_social_reuse boolean not null default false;
grant update (allow_social_reuse) on public.profiles to authenticated;

commit;
