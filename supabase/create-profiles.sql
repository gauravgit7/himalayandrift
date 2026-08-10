-- =============================================================================
-- Profiles table — linked to auth.users, one row per registered public user
-- Run in Supabase SQL Editor (fresh install)
-- If you already ran an older version, use add-profile-fields.sql instead
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text NOT NULL DEFAULT '',
  email           text,              -- stored at registration for admin queries
  community       text,              -- 'AOG' | 'CULT'
  chapter         text,              -- matches chapter_name values
  phone           text,
  avatar_url      text,              -- profile photo (also used as identity verification)
  -- Extended registration fields
  address         text,
  bike_model      text,              -- TVS bike/scooter model
  date_of_birth   date,
  license_number  text,
  -- Member approval workflow
  member_status   text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  admin_notes     text,
  approved_at     timestamptz,
  rejected_at     timestamptz,
  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Each user can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Each user can insert their own profile row (sign-up flow)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Each user can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();
