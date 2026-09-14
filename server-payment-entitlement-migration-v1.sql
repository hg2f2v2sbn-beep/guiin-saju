-- 귀인사주 결제/구매권한 foundation migration v1
PRAGMA foreign_keys = ON;

ALTER TABLE payments ADD COLUMN verified_at TEXT;
ALTER TABLE payments ADD COLUMN verification_source TEXT;
ALTER TABLE payments ADD COLUMN raw_payload_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_grant_once
ON entitlements(order_id, entitlement_type, COALESCE(resource_key,''));

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
