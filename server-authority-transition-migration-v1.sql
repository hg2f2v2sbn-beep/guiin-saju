PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS account_link_events (
  id TEXT PRIMARY KEY,
  guest_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  summary_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(guest_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_link_user
ON account_link_events(user_id, created_at);

CREATE TABLE IF NOT EXISTS client_state_migrations (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  migration_key TEXT NOT NULL,
  state TEXT NOT NULL,
  legacy_snapshot_json TEXT,
  server_snapshot_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(subject_type, subject_id, migration_key)
);

CREATE INDEX IF NOT EXISTS idx_client_state_migrations_subject
ON client_state_migrations(subject_type, subject_id, created_at);
