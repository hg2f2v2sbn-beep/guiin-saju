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
