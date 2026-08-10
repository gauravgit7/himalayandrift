-- =============================================================================
-- Migration: add bike_model column to member_cards
-- Run once in Supabase SQL Editor
-- =============================================================================

ALTER TABLE member_cards
  ADD COLUMN IF NOT EXISTS bike_model TEXT;
