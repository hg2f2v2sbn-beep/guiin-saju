-- 귀인사주 security hardening migration v1
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  subject_type TEXT,
  subject_id TEXT,
  request_id TEXT,
  route TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_type_time
ON security_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_subject
ON security_events(subject_type, subject_id, created_at);
