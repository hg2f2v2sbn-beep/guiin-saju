-- 귀인사주 D1 초기화/개발용 migration v1
-- server-schema.sql 전체를 먼저 적용한 뒤 실행해도 안전합니다.

PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_usage_subject
ON usage_quotas(subject_type, subject_id, quota_key, period_key);

CREATE INDEX IF NOT EXISTS idx_quota_res_subject
ON quota_reservations(subject_type, subject_id, state);

CREATE INDEX IF NOT EXISTS idx_ai_requests_subject
ON ai_requests(user_id, guest_session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reports_subject
ON reports(user_id, guest_session_id, created_at);

INSERT OR IGNORE INTO feature_flags(flag_key, enabled, updated_at, updated_by)
VALUES
  ('AI_CHAT_ENABLED', 1, datetime('now'), 'bootstrap'),
  ('AI_REPORT_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('NEW_PAYMENTS_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SOCIAL_LOGIN_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SERVER_WALLET_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SERVER_FREE_QUOTA_ENABLED', 0, datetime('now'), 'bootstrap');
