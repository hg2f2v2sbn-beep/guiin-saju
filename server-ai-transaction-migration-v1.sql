-- 귀인사주 AI transaction migration v1
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ai_request_events (
  id TEXT PRIMARY KEY,
  ai_request_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  event_type TEXT NOT NULL,
  request_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ai_request_id) REFERENCES ai_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_request_events_request
ON ai_request_events(ai_request_id, created_at);
