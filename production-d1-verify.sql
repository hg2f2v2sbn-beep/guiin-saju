-- 귀인사주 production D1 검증용
-- 먼저 server-d1-init.sql 전체를 production D1에 적용한 뒤 이 쿼리를 실행합니다.

SELECT name
FROM sqlite_master
WHERE type='table'
  AND name IN (
    'users','auth_identities','user_sessions','guest_sessions',
    'profiles','chart_snapshots','conversations','messages',
    'ai_requests','ai_results','orders','payments','entitlements',
    'feature_flags','service_state'
  )
ORDER BY name;

SELECT flag_key, enabled
FROM feature_flags
WHERE flag_key IN (
  'AI_CHAT_ENABLED',
  'NEW_PAYMENTS_ENABLED',
  'SERVER_WALLET_ENABLED',
  'SERVER_FREE_QUOTA_ENABLED'
)
ORDER BY flag_key;

SELECT state_key, state_value
FROM service_state
WHERE state_key IN (
  'MAINTENANCE_MODE','READ_ONLY_MODE','AI_DISABLED','PAYMENTS_DISABLED'
)
ORDER BY state_key;
