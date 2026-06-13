-- Migration: draft cleanup tracking
-- Run this in the Supabase SQL editor

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS last_active_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS draft_reminder_1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS draft_reminder_2_sent_at TIMESTAMPTZ;

-- Seed last_active_at for existing rows so nothing gets deleted immediately
UPDATE events
SET last_active_at = created_at
WHERE last_active_at IS NULL;

-- Index for the cron query performance
CREATE INDEX IF NOT EXISTS idx_events_cleanup
  ON events (status, last_active_at)
  WHERE status = 'draft';
