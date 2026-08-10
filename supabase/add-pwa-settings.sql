-- =============================================================================
-- Migration: pwa_settings
-- Stores the PWA app name and icon — editable via admin.
-- Run in Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS pwa_settings (
  id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single-row table
  app_name    TEXT NOT NULL DEFAULT 'TVS Nepal Ride Operations',
  short_name  TEXT NOT NULL DEFAULT 'TVS Nepal',
  icon_url    TEXT,          -- Supabase Storage URL; null = use static fallback
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed default row
INSERT INTO pwa_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: public can read (manifest route is server-side but uses anon key)
ALTER TABLE pwa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pwa settings"
  ON pwa_settings FOR SELECT
  USING (true);
