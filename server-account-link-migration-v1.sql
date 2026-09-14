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
