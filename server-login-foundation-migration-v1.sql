PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_login_states (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  state_hash TEXT NOT NULL UNIQUE,
  code_verifier_hash TEXT,
  guest_session_id TEXT,
  redirect_path TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_auth_login_states_expiry
ON auth_login_states(expires_at, used_at);

CREATE INDEX IF NOT EXISTS idx_auth_provider_user
ON auth_identities(provider, provider_user_id);
