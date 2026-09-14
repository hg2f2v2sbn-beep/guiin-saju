-- 귀인사주 chart/AI persistence migration v1
PRAGMA foreign_keys = ON;

-- 새 DB는 server-schema.sql을 사용합니다.
-- 기존 D1이 이미 존재하는 경우 아래 migration을 순서대로 적용합니다.

ALTER TABLE chart_snapshots
ADD COLUMN verification_state TEXT NOT NULL DEFAULT 'CLIENT_FACTS_UNVERIFIED';

CREATE INDEX IF NOT EXISTS idx_chart_subject_key
ON chart_snapshots(user_id, guest_session_id, chart_key, calculation_rule_version, created_at);

CREATE TABLE IF NOT EXISTS ai_results (
  id TEXT PRIMARY KEY,
  ai_request_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL UNIQUE,
  response_text TEXT NOT NULL,
  response_json TEXT,
  quality_json TEXT,
  chart_snapshot_id TEXT,
  conversation_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ai_request_id) REFERENCES ai_requests(id),
  FOREIGN KEY (chart_snapshot_id) REFERENCES chart_snapshots(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_results_conversation
ON ai_results(conversation_id, created_at);
