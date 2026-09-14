PRAGMA foreign_keys = ON;
ALTER TABLE wallet_accounts ADD COLUMN reserved_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_requests ADD COLUMN charge_source TEXT;
ALTER TABLE ai_requests ADD COLUMN quota_reservation_id TEXT;
ALTER TABLE ai_requests ADD COLUMN wallet_reservation_id TEXT;
CREATE INDEX IF NOT EXISTS idx_quota_reservation_request ON quota_reservations(request_id, state);
CREATE INDEX IF NOT EXISTS idx_wallet_reservation_request ON wallet_reservations(request_id, state);
