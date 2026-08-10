-- =============================================================================
-- Migration: add specialty column to marshals table
-- specialty: comma-separated tags shown as chips on the public Marshals page
-- e.g. "Navigation, Route Planning, High Altitude"
-- Run this in Supabase SQL Editor once.
-- =============================================================================

ALTER TABLE marshals
  ADD COLUMN IF NOT EXISTS specialty text;
