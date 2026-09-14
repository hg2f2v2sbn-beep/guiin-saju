# 귀인사주 Cloudflare + D1 배포 준비서

이 파일은 지금 바로 모바일에서 할 작업이 아니라, 나중에 컴퓨터에서 Cloudflare를 설정할 때 그대로 따라가기 위한 순서입니다.

## 현재 상태
- GitHub의 실제 사이트/테스트는 정상 유지합니다.
- 현재 실제 Cloudflare Worker는 기존 AI Worker를 유지합니다.
- `worker-v4-integrated-preview.js`는 통합 배포 후보입니다.
- 결제는 OFF 상태를 유지합니다.
- 서버 무료횟수/클로버 최종차감도 아직 OFF입니다.

## 컴퓨터에서 진행할 순서

1. Cloudflare Dashboard → Workers & Pages → D1에서 `guiin-saju-db` 데이터베이스를 새로 만듭니다.
2. D1 SQL Console에서 `server-d1-init.sql` 전체를 실행합니다.
3. 실행 후 아래 테이블이 생성됐는지 확인합니다.
   - users
   - guest_sessions
   - profiles
   - chart_snapshots
   - conversations
   - messages
   - usage_quotas
   - wallet_accounts
   - wallet_ledger
   - orders
   - payments
   - entitlements
   - ai_requests
   - feature_flags
4. Worker Settings → Bindings에서 D1 binding을 추가합니다.
   - Variable name: `DB`
   - Database: `guiin-saju-db`
5. `OPENAI_API_KEY`는 기존 Cloudflare Secret을 그대로 유지합니다. 코드나 GitHub 파일에 키를 적지 않습니다.
6. 선택사항으로 KV namespace를 만들면 binding 이름을 `AI_IDEMPOTENCY`로 연결합니다.
7. 아직 실제 Worker 코드는 바로 교체하지 않습니다. 먼저 현재 `/health`와 AI 상담이 정상인지 기록합니다.
8. 이후 `worker-v4-integrated-preview.js`를 Cloudflare Worker에 넣고 Deploy합니다.
9. 배포 직후 `/health`에서 다음을 확인합니다.
   - version = `4.0-integrated-preview`
   - databaseReady = true
   - serverAccountingReady = false
   - paymentsEnabled = false
10. `/api/session/guest` → `/api/me/usage` 순서로 테스트합니다.
11. AI 상담 `/api/chat`도 다시 테스트합니다.
12. AI 상담이 정상이고 D1 API도 정상인 경우에만 다음 단계로 넘어갑니다.

## 절대 아직 켜지 않는 것
- NEW_PAYMENTS_ENABLED
- SERVER_WALLET_ENABLED
- SERVER_FREE_QUOTA_ENABLED
- 실제 PG 결제
- 서버 클로버 최종차감

## 롤백
문제가 생기면 Cloudflare Worker 코드만 직전 v2.2 `worker.js`로 되돌립니다.
D1 데이터베이스는 삭제하지 않아도 됩니다. v4는 DB가 없어도 AI가 동작하도록 설계했지만, 실제 배포 후 문제가 있으면 Worker 코드부터 롤백합니다.
