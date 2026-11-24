-- ==============================================================================
-- OverWatch Database Schema for Supabase
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE media_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

-- For simple single-user setup, allow anon access (can be locked down with Supabase Auth or pairing secret)
CREATE POLICY "Allow public read-write for media_state" ON media_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for quota_snapshots" ON quota_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for permission_requests" ON permission_requests FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime Replication for these tables
-- This allows both the PC client and the Phone web app to listen for live row changes!
DO $$
BEGIN
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
