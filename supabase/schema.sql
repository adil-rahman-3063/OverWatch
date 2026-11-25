-- ==============================================================================
-- OverWatch Database Schema for Supabase
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- Safe to re-run multiple times (Idempotent)
-- ==============================================================================

-- 1. Enable UUID generation (Native in Postgres 13+, fallback to extension)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Media State Table (tracks currently playing track on Windows PC)
CREATE TABLE IF NOT EXISTS media_state (
    device_id TEXT PRIMARY KEY DEFAULT 'default',
    title TEXT DEFAULT '',
    artist TEXT DEFAULT '',
    album TEXT DEFAULT '',
    playback_status TEXT DEFAULT 'Stopped', -- 'Playing', 'Paused', 'Stopped', 'NoActiveSession'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quota Snapshots Table (tracks Antigravity & Claude token/bucket limits)
CREATE TABLE IF NOT EXISTS quota_snapshots (
    device_id TEXT PRIMARY KEY DEFAULT 'default',
    antigravity JSONB DEFAULT '{}'::jsonb,
    claude JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Permission Requests Table (Agent tool execution approvals)
CREATE TABLE IF NOT EXISTS permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT DEFAULT 'default',
    agent TEXT NOT NULL,                -- 'antigravity' | 'claude'
    tool TEXT NOT NULL,                 -- e.g. 'run_command', 'edit_file'
    command TEXT,                       -- The command string or tool args
    cwd TEXT,                           -- Working directory
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'allowed', 'denied', 'expired'
    decision_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 seconds')
);

-- Index for speedy queries on pending requests
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON permission_requests(status, device_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_created ON permission_requests(created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE media_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies (Safe to re-run without throwing "policy already exists" errors)
DROP POLICY IF EXISTS "Allow public read-write for media_state" ON media_state;
CREATE POLICY "Allow public read-write for media_state" ON media_state FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for quota_snapshots" ON quota_snapshots;
CREATE POLICY "Allow public read-write for quota_snapshots" ON quota_snapshots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for permission_requests" ON permission_requests;
CREATE POLICY "Allow public read-write for permission_requests" ON permission_requests FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime Replication for these tables
-- This allows both the PC client and the Phone web app to listen for live row changes!
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'media_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE media_state;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'quota_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quota_snapshots;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'permission_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE permission_requests;
  END IF;
END $$;

-- 7. Optional Housekeeping Function (Run periodically or via pg_cron to prune stale logs)
CREATE OR REPLACE FUNCTION purge_old_permission_requests(older_than_days INT DEFAULT 7)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM permission_requests
    WHERE created_at < NOW() - (older_than_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
