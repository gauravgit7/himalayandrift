-- =============================================================================
-- Migration: push_subscriptions + push_settings
-- Run in Supabase SQL Editor
-- =============================================================================

-- Push subscription storage (one row per browser/device)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,   -- public key
  auth         TEXT NOT NULL,   -- auth secret
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for fast cleanup of expired subscriptions
CREATE INDEX IF NOT EXISTS push_subscriptions_created_at_idx
  ON push_subscriptions (created_at);

-- App-wide push notification settings (single row)
CREATE TABLE IF NOT EXISTS push_settings (
  id                  INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces single row
  enabled             BOOLEAN DEFAULT true,
  prompt_style        TEXT DEFAULT 'banner' CHECK (prompt_style IN ('banner', 'modal')),
  prompt_delay_secs   INT DEFAULT 5,
  prompt_page         TEXT DEFAULT 'rides' CHECK (prompt_page IN ('home', 'rides', 'any')),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Seed default settings
INSERT INTO push_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: push_subscriptions — public write (subscribe/unsubscribe), no read
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can unsubscribe by endpoint"
  ON push_subscriptions FOR DELETE
  USING (true);

-- RLS: push_settings — public read (components need to read settings)
ALTER TABLE push_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read push settings"
  ON push_settings FOR SELECT
  USING (true);
