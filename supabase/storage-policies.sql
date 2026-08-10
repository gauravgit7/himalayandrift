-- =============================================================================
-- Storage Buckets + RLS Policies
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create buckets (public = files are readable without auth)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ride-banners',   'ride-banners',   true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('hero-banners',   'hero-banners',   true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('sponsor-logos',  'sponsor-logos',  true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('rider-avatars',  'rider-avatars',  true,  5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('brand-logos',    'brand-logos',    true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS policies — public SELECT, authenticated INSERT/UPDATE/DELETE
--    Applied per-bucket so each bucket is independently controlled.
-- ---------------------------------------------------------------------------

-- ── ride-banners ────────────────────────────────────────────────────────────
CREATE POLICY "Public read ride-banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ride-banners');

CREATE POLICY "Auth upload ride-banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ride-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update ride-banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ride-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete ride-banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ride-banners' AND auth.role() = 'authenticated');

-- ── hero-banners ────────────────────────────────────────────────────────────
CREATE POLICY "Public read hero-banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-banners');

CREATE POLICY "Auth upload hero-banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update hero-banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete hero-banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-banners' AND auth.role() = 'authenticated');

-- ── sponsor-logos ───────────────────────────────────────────────────────────
CREATE POLICY "Public read sponsor-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sponsor-logos');

CREATE POLICY "Auth upload sponsor-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update sponsor-logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete sponsor-logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');

-- ── rider-avatars ───────────────────────────────────────────────────────────
CREATE POLICY "Public read rider-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rider-avatars');

CREATE POLICY "Auth upload rider-avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rider-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update rider-avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'rider-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete rider-avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'rider-avatars' AND auth.role() = 'authenticated');

-- ── brand-logos ─────────────────────────────────────────────────────────────
CREATE POLICY "Public read brand-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

CREATE POLICY "Auth upload brand-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update brand-logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete brand-logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');
