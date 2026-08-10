-- =============================================================================
-- Migration: add instagram_handle to marshals
-- Run in Supabase SQL Editor → Dashboard → SQL Editor
-- =============================================================================

ALTER TABLE marshals
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- Optional: add a comment for documentation
COMMENT ON COLUMN marshals.instagram_handle IS
  'Instagram username without @ prefix, e.g. "tvs_rider_ram". Used to generate a QR code on the public marshal card.';
