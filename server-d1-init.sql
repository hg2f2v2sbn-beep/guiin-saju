PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  display_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email_normalized TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_email ON auth_identities(email_normalized);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  absolute_expires_at TEXT,
  idle_timeout_seconds INTEGER NOT NULL DEFAULT 2592000,
  rotated_at TEXT,
  previous_token_hash TEXT,
  revoked_at TEXT,
  revoke_reason TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS guest_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,
  expires_at TEXT NOT NULL,
  absolute_expires_at TEXT,
  idle_timeout_seconds INTEGER NOT NULL DEFAULT 15552000,
  rotated_at TEXT,
  previous_token_hash TEXT,
  revoked_at TEXT,
  revoke_reason TEXT,
  converted_user_id TEXT,
  FOREIGN KEY (converted_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  granted INTEGER NOT NULL,
  granted_at TEXT NOT NULL,
  source TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  label TEXT,
  display_name TEXT,
  calendar TEXT NOT NULL,
  lunar_leap_month INTEGER NOT NULL DEFAULT 0,
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_hour INTEGER,
  birth_minute INTEGER,
  hour_unknown INTEGER NOT NULL DEFAULT 0,
  gender TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  day_boundary TEXT NOT NULL DEFAULT '23',
  true_solar_time INTEGER NOT NULL DEFAULT 0,
  longitude REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  CHECK ((user_id IS NOT NULL) OR (guest_session_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_active ON profiles(user_id, deleted_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_guest_active ON profiles(guest_session_id, deleted_at, updated_at);

CREATE TABLE IF NOT EXISTS chart_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  profile_id TEXT,
  chart_key TEXT NOT NULL,
  calculation_engine_version TEXT,
  calculation_rule_version TEXT NOT NULL,
  normalized_input_json TEXT NOT NULL,
  chart_facts_json TEXT NOT NULL,
  uncertainty_json TEXT,
  verification_state TEXT NOT NULL DEFAULT 'CLIENT_FACTS_UNVERIFIED',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CHECK ((user_id IS NOT NULL) OR (guest_session_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_chart_key ON chart_snapshots(chart_key, calculation_rule_version);
CREATE INDEX IF NOT EXISTS idx_chart_snapshots_profile ON chart_snapshots(profile_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chart_subject_key
ON chart_snapshots(user_id, guest_session_id, chart_key, calculation_rule_version, created_at);


CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL,
  name TEXT NOT NULL,
  price_amount INTEGER NOT NULL CHECK(price_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KRW',
  benefits_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  product_id TEXT NOT NULL,
  chart_snapshot_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  product_snapshot_json TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KRW',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (chart_snapshot_id) REFERENCES chart_snapshots(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT UNIQUE,
  state TEXT NOT NULL,
  approved_amount INTEGER,
  currency TEXT,
  approved_at TEXT,
  verified_at TEXT,
  verification_source TEXT,
  raw_payload_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);


CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  request_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order
ON payment_events(order_id, created_at);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  provider_refund_id TEXT,
  amount INTEGER NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KRW',
  state TEXT NOT NULL,
  reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  verified_at TEXT,
  failure_code TEXT,
  metadata_json TEXT,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT,
  payload_hash TEXT,
  state TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  next_retry_at TEXT,
  UNIQUE(provider, provider_event_id)
);


CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  scanned_count INTEGER NOT NULL DEFAULT 0,
  issue_count INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS reconciliation_issues (
  id TEXT PRIMARY KEY,
  reconciliation_run_id TEXT,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  order_id TEXT,
  payment_id TEXT,
  refund_id TEXT,
  subject_type TEXT,
  subject_id TEXT,
  state TEXT NOT NULL DEFAULT 'OPEN',
  details_json TEXT,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (reconciliation_run_id) REFERENCES reconciliation_runs(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (refund_id) REFERENCES refunds(id)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_open
ON reconciliation_issues(state, issue_type, detected_at);

CREATE INDEX IF NOT EXISTS idx_webhook_retry
ON webhook_events(state, next_retry_at);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  order_id TEXT NOT NULL,
  entitlement_type TEXT NOT NULL,
  resource_key TEXT,
  state TEXT NOT NULL DEFAULT 'ACTIVE',
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  metadata_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id, state, entitlement_type);
CREATE INDEX IF NOT EXISTS idx_entitlements_guest ON entitlements(guest_session_id, state, entitlement_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_grant_once
ON entitlements(order_id, entitlement_type, COALESCE(resource_key,''));


CREATE TABLE IF NOT EXISTS wallet_accounts (
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  reserved_balance INTEGER NOT NULL DEFAULT 0 CHECK (reserved_balance >= 0 AND reserved_balance <= balance),
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(subject_type, subject_id)
);

CREATE TABLE IF NOT EXISTS wallet_reservations (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  request_id TEXT,
  order_id TEXT,
  reservation_id TEXT,
  kind TEXT NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (reservation_id) REFERENCES wallet_reservations(id)
);

CREATE TABLE IF NOT EXISTS usage_quotas (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  quota_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK(used_count >= 0),
  reserved_count INTEGER NOT NULL DEFAULT 0 CHECK(reserved_count >= 0),
  limit_count INTEGER NOT NULL CHECK(limit_count >= 0),
  updated_at TEXT NOT NULL,
  UNIQUE(subject_type, subject_id, quota_key, period_key)
);

CREATE TABLE IF NOT EXISTS quota_reservations (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  quota_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  state TEXT NOT NULL,
  request_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  chart_snapshot_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  state TEXT NOT NULL,
  interpretation_version TEXT NOT NULL,
  prompt_version TEXT,
  model_id TEXT,
  quality_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ready_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (chart_snapshot_id) REFERENCES chart_snapshots(id)
);

CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  section_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  evidence_json TEXT,
  confidence REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  UNIQUE(report_id, section_key)
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  chart_snapshot_id TEXT,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (chart_snapshot_id) REFERENCES chart_snapshots(id),
  CHECK ((user_id IS NOT NULL) OR (guest_session_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_conversations_subject_recent ON conversations(user_id, guest_session_id, deleted_at, updated_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  request_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_request_role
ON messages(conversation_id, request_id, role)
WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  summary_version INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  through_message_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  UNIQUE(conversation_id, summary_version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_summary_version
ON conversation_summaries(conversation_id, summary_version);

CREATE TABLE IF NOT EXISTS ai_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  conversation_id TEXT,
  chart_snapshot_id TEXT,
  request_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  model_id TEXT,
  prompt_version TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost REAL,
  error_code TEXT,
  charge_source TEXT,
  quota_reservation_id TEXT,
  wallet_reservation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (chart_snapshot_id) REFERENCES chart_snapshots(id)
);


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


CREATE TABLE IF NOT EXISTS guest_conversions (
  id TEXT PRIMARY KEY,
  guest_session_id TEXT NOT NULL UNIQUE,
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

CREATE TABLE IF NOT EXISTS feature_flags (
  flag_key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);


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


CREATE TABLE IF NOT EXISTS admin_security (
  user_id TEXT PRIMARY KEY,
  mfa_required INTEGER NOT NULL DEFAULT 1,
  mfa_verified_at TEXT,
  access_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS csrf_nonces (
  nonce_hash TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_manifests (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  state TEXT NOT NULL,
  source_version TEXT,
  schema_version TEXT,
  object_count INTEGER,
  checksum TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT,
  restore_tested_at TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS recovery_runs (
  id TEXT PRIMARY KEY,
  recovery_type TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS support_cases (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_session_id TEXT,
  order_id TEXT,
  payment_id TEXT,
  category TEXT NOT NULL,
  state TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  request_id TEXT,
  metadata_json TEXT,
  prev_hash TEXT,
  entry_hash TEXT,
  created_at TEXT NOT NULL
);

-- 귀인사주 D1 안전 초기값 v1
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO feature_flags(flag_key, enabled, updated_at, updated_by)
VALUES
  ('AI_CHAT_ENABLED', 1, datetime('now'), 'bootstrap'),
  ('AI_REPORT_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('NEW_PAYMENTS_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SOCIAL_LOGIN_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SERVER_WALLET_ENABLED', 0, datetime('now'), 'bootstrap'),
  ('SERVER_FREE_QUOTA_ENABLED', 0, datetime('now'), 'bootstrap');

-- 가격 정의만 저장한다. 결제 활성화와는 무관하며 NEW_PAYMENTS_ENABLED=0을 유지한다.
INSERT OR IGNORE INTO products(
  id, product_code, product_type, name, price_amount, currency,
  benefits_json, active, version, created_at, updated_at
) VALUES
  ('prod_lifetime_5900','LIFETIME_SAJU','report','평생사주',5900,'KRW','{"entitlement":"lifetime_saju"}',1,1,datetime('now'),datetime('now')),
  ('prod_compat_7900','PREMIUM_COMPAT','report','프리미엄 궁합',7900,'KRW','{"entitlement":"premium_compat"}',1,1,datetime('now'),datetime('now')),
  ('prod_clover_1100','CLOVER_1','wallet','행운의 클로버',1100,'KRW','{"credits":1}',1,1,datetime('now'),datetime('now')),
  ('prod_clover_1650','CLOVER_2','wallet','행운의 클로버 2개',1650,'KRW','{"credits":2}',1,1,datetime('now'),datetime('now')),
  ('prod_clover_2750','CLOVER_4','wallet','행운의 클로버 4개',2750,'KRW','{"credits":4}',1,1,datetime('now'),datetime('now'));
