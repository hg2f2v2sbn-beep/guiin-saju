-- 귀인사주 환불/정산/웹훅복구 migration v1
PRAGMA foreign_keys = ON;

ALTER TABLE refunds ADD COLUMN verified_at TEXT;
ALTER TABLE refunds ADD COLUMN failure_code TEXT;
ALTER TABLE refunds ADD COLUMN metadata_json TEXT;

ALTER TABLE webhook_events ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN last_error TEXT;
ALTER TABLE webhook_events ADD COLUMN next_retry_at TEXT;

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
