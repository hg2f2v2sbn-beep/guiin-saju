-- 귀인사주 통합 서버 보정 migration v2
PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_conversion_once
ON guest_conversions(guest_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_summary_version
ON conversation_summaries(conversation_id, summary_version);

CREATE INDEX IF NOT EXISTS idx_usage_subject
ON usage_quotas(subject_type, subject_id, quota_key, period_key);

CREATE INDEX IF NOT EXISTS idx_quota_res_subject
ON quota_reservations(subject_type, subject_id, state);

CREATE INDEX IF NOT EXISTS idx_ai_requests_subject
ON ai_requests(user_id, guest_session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id, created_at);
