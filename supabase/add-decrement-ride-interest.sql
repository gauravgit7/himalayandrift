-- =============================================================================
-- Migration: add decrement function for ride interest toggle
-- Run once in Supabase SQL Editor
-- =============================================================================

-- Atomic decrement — floors at 0 so count can never go negative
CREATE OR REPLACE FUNCTION decrement_ride_interest(ride_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE rides
     SET interest_count = GREATEST(interest_count - 1, 0)
   WHERE id = ride_id
  RETURNING interest_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
