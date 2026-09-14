PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS service_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS incident_events (
  id TEXT PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  state TEXT NOT NULL,
  request_id TEXT,
  subject_type TEXT,
  subject_id TEXT,
  order_id TEXT,
  ai_request_id TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_incident_open
ON incident_events(state, severity, created_at);

CREATE TABLE IF NOT EXISTS migration_history (
  migration_id TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  app_version TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS integrity_checks (
  id TEXT PRIMARY KEY,
  check_type TEXT NOT NULL,
  state TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  issue_count INTEGER NOT NULL DEFAULT 0,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_integrity_checks_recent
ON integrity_checks(check_type, checked_at);
