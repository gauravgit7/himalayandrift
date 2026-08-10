-- =============================================================================
-- Migration: add interest_count to rides
-- Run once in Supabase SQL Editor
-- =============================================================================

-- 1. Add column (safe — does nothing if it already exists)
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS interest_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Atomic increment function — avoids race conditions from concurrent taps
CREATE OR REPLACE FUNCTION increment_ride_interest(ride_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE rides
     SET interest_count = interest_count + 1
   WHERE id = ride_id
  RETURNING interest_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
