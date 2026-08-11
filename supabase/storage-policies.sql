-- =============================================================================
-- Himalayan Drift — storage buckets + policies
--
-- Run ONCE in: Supabase Dashboard → SQL Editor, AFTER schema.sql.
-- Creates every bucket the app uploads to and its access policies, so there is
-- nothing to click through in the Storage UI.
--
-- Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets
--
-- All are public-read: uploaded images are served straight to the browser and
-- next/image is configured for *.supabase.co.
--
-- Size limits are generous but finite so a stray 40 MB phone photo fails at the
-- edge rather than filling the project's storage quota.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('ride-banners',  'ride-banners',  true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('hero-banners',  'hero-banners',  true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('brand-logos',   'brand-logos',   true,  5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('sponsor-logos', 'sponsor-logos', true,  5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('rider-avatars', 'rider-avatars', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('member-photos', 'member-photos', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('pwa-icons',     'pwa-icons',     true,  2097152, array['image/png','image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Policies
--
-- Two shapes:
--   admin buckets  — public read, authenticated write
--   member-photos  — public read, ANON write
--
-- member-photos is the exception on purpose. Membership applications come from
-- signed-out visitors, so the applicant's identity photo is uploaded with the
-- anon key. Restricting it to authenticated would break public applications.
-- ---------------------------------------------------------------------------

do $$
declare
  admin_bucket text;
begin
  foreach admin_bucket in array array[
    'ride-banners', 'hero-banners', 'brand-logos',
    'sponsor-logos', 'rider-avatars', 'pwa-icons'
  ] loop
    execute format('drop policy if exists %I on storage.objects', 'public_read_'   || admin_bucket);
    execute format('drop policy if exists %I on storage.objects', 'auth_upload_'   || admin_bucket);
    execute format('drop policy if exists %I on storage.objects', 'auth_update_'   || admin_bucket);
    execute format('drop policy if exists %I on storage.objects', 'auth_delete_'   || admin_bucket);

    execute format(
      'create policy %I on storage.objects for select using (bucket_id = %L)',
      'public_read_' || admin_bucket, admin_bucket);

    execute format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L)',
      'auth_upload_' || admin_bucket, admin_bucket);

    execute format(
      'create policy %I on storage.objects for update to authenticated using (bucket_id = %L)',
      'auth_update_' || admin_bucket, admin_bucket);

    execute format(
      'create policy %I on storage.objects for delete to authenticated using (bucket_id = %L)',
      'auth_delete_' || admin_bucket, admin_bucket);
  end loop;
end $$;

-- ── member-photos: anon upload, public read ────────────────────────────────
drop policy if exists "public_read_member-photos"   on storage.objects;
drop policy if exists "public_upload_member-photos" on storage.objects;
drop policy if exists "auth_delete_member-photos"   on storage.objects;

create policy "public_read_member-photos"
  on storage.objects for select
  using (bucket_id = 'member-photos');

-- Applicants are signed out when they submit.
create policy "public_upload_member-photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'member-photos');

-- Only admins clean up; applicants cannot delete someone else's photo.
create policy "auth_delete_member-photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-photos');

-- =============================================================================
-- Done. Remaining setup is in .env.local.example:
--   Supabase URL + anon key + service-role key
--   ADMIN_EMAILS  (full address, including the domain)
--   auth redirect URL for /auth/callback
--   VAPID keys, if you want push notifications
-- =============================================================================
