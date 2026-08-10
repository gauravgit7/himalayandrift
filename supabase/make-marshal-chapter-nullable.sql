-- =============================================================================
-- Migration: make marshals.chapter nullable
-- Head Marshal is national-level, not tied to a chapter.
-- Run in Supabase SQL Editor.
-- =============================================================================

ALTER TABLE marshals ALTER COLUMN chapter DROP NOT NULL;

-- Head Marshal rows (if any exist) can be updated manually:
-- UPDATE marshals SET chapter = NULL WHERE role = 'Head Marshal';
