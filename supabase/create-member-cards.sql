-- =============================================================================
-- Migration: TVS Nepal Membership Cards
-- Run once in Supabase SQL Editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- member_cards — one row per application
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS member_cards (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Private access code (shown once after submission, used to check status)
  access_code         TEXT        UNIQUE NOT NULL,

  -- Public card number (assigned on approval: AOG-BAG-26-00001)
  card_number         TEXT        UNIQUE,

  -- Applicant details
  full_name           TEXT        NOT NULL,
  photo_url           TEXT        NOT NULL,
  date_of_birth       DATE        NOT NULL,
  blood_group         TEXT        NOT NULL,
  emergency_phone     TEXT        NOT NULL,
  license_number      TEXT        NOT NULL,   -- stored, not displayed on card
  community           TEXT        NOT NULL CHECK (community IN ('AOG', 'CULT')),
  chapter             TEXT        NOT NULL,
  consent_accepted    BOOLEAN     NOT NULL DEFAULT false,

  -- Workflow
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason    TEXT,
  admin_notes         TEXT,
  resubmission_count  INTEGER     NOT NULL DEFAULT 0,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  valid_until         DATE
);

-- ---------------------------------------------------------------------------
-- card_settings — single-row admin configuration
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS card_settings (
  id                  INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tagline             TEXT        NOT NULL DEFAULT 'NEPAL RIDES TOGETHER',
  disclaimer          TEXT        NOT NULL DEFAULT 'If found, please return to the original owner or nearest TVS Nepal showroom.',
  validity_years      INTEGER     NOT NULL DEFAULT 2,

  -- Field visibility on the printed card
  show_blood_group    BOOLEAN     NOT NULL DEFAULT true,
  show_dob            BOOLEAN     NOT NULL DEFAULT true,
  show_emergency_phone BOOLEAN    NOT NULL DEFAULT true,
  show_chapter        BOOLEAN     NOT NULL DEFAULT true,

  -- Configurable benefits list shown on the membership landing page
  benefits            JSONB       NOT NULL DEFAULT '[]',

  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default row
INSERT INTO card_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE member_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
DROP POLICY IF EXISTS "public_insert_member_cards" ON member_cards;
CREATE POLICY "public_insert_member_cards"
  ON member_cards FOR INSERT TO anon WITH CHECK (true);

-- Anyone can read cards (needed for status check + QR validation)
DROP POLICY IF EXISTS "public_read_member_cards" ON member_cards;
CREATE POLICY "public_read_member_cards"
  ON member_cards FOR SELECT TO anon USING (true);

-- Anyone can read card_settings (needed for public benefits section)
DROP POLICY IF EXISTS "public_read_card_settings" ON card_settings;
CREATE POLICY "public_read_card_settings"
  ON card_settings FOR SELECT TO anon USING (true);

-- All writes to card_settings and updates to member_cards are via service role
-- (service role bypasses RLS automatically — no explicit policy needed)
