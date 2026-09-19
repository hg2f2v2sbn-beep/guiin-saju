# 귀인사주 Production Worker + D1 구축 v1

현재 사이트는 계속 staging Worker를 사용합니다.
이번 묶음은 production 인프라를 '따로' 만드는 단계이며, 프론트를 production으로 바꾸지 않습니다.

## 1. Production D1 생성
Cloudflare Dashboard → D1 → Create database

이름:
`guiin-saju-production-db`

생성한 D1의 database_id를 `wrangler.production.example.toml`의
`PUT_PRODUCTION_D1_DATABASE_ID_HERE` 자리에 넣습니다.

## 2. Production D1 스키마 적용
GitHub 루트의 기존 `server-d1-init.sql` 전체를 production D1 SQL Console에서 실행합니다.

그 다음 이 패키지의 `production-d1-verify.sql`을 실행합니다.
필수 테이블과 feature flag/service_state가 조회되어야 합니다.

중요:
- NEW_PAYMENTS_ENABLED = 0
- SERVER_WALLET_ENABLED = 0
- SERVER_FREE_QUOTA_ENABLED = 0
- PAYMENTS_DISABLED = true

## 3. Production Worker 생성
Workers & Pages → Create Worker

이름:
`guiin-saju-api`

코드는 `worker-production-candidate.js` 전체를 넣습니다.

D1 Binding:
- Variable name: `DB`
- Database: `guiin-saju-production-db`

## 4. Production Vars
다음 일반 변수를 설정합니다.

- ENVIRONMENT = production
- AI_CHAT_ENABLED = true
- CHAT_MODEL = gpt-4o-mini
- LOGIN_KAKAO_ENABLED = true
- KAKAO_FRONTEND_ORIGIN = https://gwiinsaju.com
- KAKAO_REDIRECT_URI = https://guiin-saju-api.blue-wls.workers.dev/api/auth/kakao/callback
- CLIENT_AUTHORITY_MODE = SHADOW
- NEW_PAYMENTS_ENABLED = false
- SERVER_WALLET_ENABLED = false
- SERVER_FREE_QUOTA_ENABLED = false
- SECURITY_ENFORCEMENT_ENABLED = false
- FINAL_CODE_GATE_VERIFIED = false

## 5. Production Secrets
값은 GitHub/파일에 적지 않고 Cloudflare Secret으로만 등록합니다.

- OPENAI_API_KEY
- KAKAO_REST_API_KEY
- KAKAO_CLIENT_SECRET
- SECURITY_HASH_SECRET

기존 staging의 secret '값'을 대화나 코드에 복사하지 마세요.
Cloudflare에서 production Worker의 Secret으로 별도 등록합니다.

## 6. Kakao Developers
production Redirect URI에 아래 주소가 등록되어 있어야 합니다.

`https://guiin-saju-api.blue-wls.workers.dev/api/auth/kakao/callback`

기존 staging Redirect URI는 삭제하지 않습니다.
staging 테스트와 production 테스트를 둘 다 할 수 있도록 둘 다 유지합니다.

## 7. 첫 배포 후 검사
브라우저에서 production Worker의:

- `/health`
- `/api/production/readiness`

를 확인합니다.

정상 목표:
- version = 6.1-production-candidate
- environment = production
- databaseReady = true
- productionInfrastructureReady = true
- paymentsEnabled = false
- missing = []
- unsafe = []

## 8. 실제 smoke
프론트는 아직 staging을 보게 둔 상태에서 production API만 직접 검사합니다.

순서:
1. guest session 생성
2. profile 저장/조회/삭제
3. chart snapshot 생성
4. conversation 생성/메시지 조회
5. AI chat
6. Kakao login start → callback → handoff
7. `/api/me`
8. logout 후 세션 무효화
9. `/api/me/purchases`는 결제 OFF 상태에서 기존 구매 복원 읽기만 확인

## 9. 절대 아직 하지 않는 것
- `guiin-runtime-config.js`를 production으로 변경
- NEW_PAYMENTS_ENABLED=true
- SERVER_WALLET_ENABLED=true
- SERVER_FREE_QUOTA_ENABLED=true
- 실제 PG 결제 오픈
- 기존 staging Worker 삭제
- 기존 staging D1 삭제

production smoke가 모두 PASS된 뒤에만 프론트 전환 작업으로 넘어갑니다.
