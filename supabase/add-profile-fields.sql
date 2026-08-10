-- =============================================================================
-- Migration: add new columns to existing profiles table
-- Run this in Supabase SQL Editor ONLY if you already ran create-profiles.sql
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS bike_model      text,
  ADD COLUMN IF NOT EXISTS date_of_birth   date,
  ADD COLUMN IF NOT EXISTS license_number  text,
  ADD COLUMN IF NOT EXISTS admin_notes     text,
  ADD COLUMN IF NOT EXISTS approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at     timestamptz;

-- member_status needs NOT NULL + DEFAULT — handle existing rows first
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_status text;
UPDATE profiles SET member_status = 'pending' WHERE member_status IS NULL;
ALTER TABLE profiles ALTER COLUMN member_status SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN member_status SET DEFAULT 'pending';
