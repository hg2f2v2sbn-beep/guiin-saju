-- 귀인사주 profile/conversation/guest-conversion migration v1
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS guest_conversions (
  id TEXT PRIMARY KEY,
  guest_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_conversion_once
ON guest_conversions(guest_session_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_active
ON profiles(user_id, deleted_at, updated_at);

CREATE INDEX IF NOT EXISTS idx_chart_snapshots_profile
ON chart_snapshots(profile_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_subject_recent
ON conversations(user_id, guest_session_id, deleted_at, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_request_role
ON messages(conversation_id, request_id, role)
WHERE request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_summary_version
ON conversation_summaries(conversation_id, summary_version);
