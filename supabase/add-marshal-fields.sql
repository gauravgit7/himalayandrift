-- =============================================================================
-- Migration: extend marshals table for multi-marshal chapter support
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- New profile fields
ALTER TABLE marshals
  ADD COLUMN IF NOT EXISTS role              text    NOT NULL DEFAULT 'Ride Captain',
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS total_rides_led   integer NOT NULL DEFAULT 0;

-- Index for fast lookups by chapter (powers the per-chapter marshal list)
CREATE INDEX IF NOT EXISTS idx_marshals_chapter ON marshals(chapter);

-- RLS: already inherits the existing policies (public read / auth write)
-- No new policies needed.
