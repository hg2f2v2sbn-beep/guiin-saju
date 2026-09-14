PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pg_test_transactions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  test_mode INTEGER NOT NULL DEFAULT 1,
  provider_tx_id TEXT,
  state TEXT NOT NULL,
  request_hash TEXT,
  response_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_pg_test_transactions_order
ON pg_test_transactions(order_id, created_at);

CREATE TABLE IF NOT EXISTS webhook_signatures (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT,
  signature_version TEXT,
  signature_hash TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_signatures_provider_event
ON webhook_signatures(provider, provider_event_id);
