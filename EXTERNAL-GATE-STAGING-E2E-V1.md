# 귀인사주 — 외부 Gate 1단계: Cloudflare Staging 실제 연결

30/30 코드 준비 이후의 첫 실제 검증 단계입니다.
이 단계는 GitHub 코드 추가 단계가 아니라 **실제 Cloudflare staging 환경을 만들고 증거를 남기는 단계**입니다.

## 현재 상태
- GitHub site-check: 통과
- Pages: 통과
- 코드 준비: 30/30
- 실결제: OFF
- Production Launch: BLOCKED

## 컴퓨터에서 진행할 실제 순서

1. Cloudflare에서 D1 데이터베이스 `guiin-saju-staging-db` 생성
2. `server-d1-init.sql` 전체 실행
3. 별도 Worker `guiin-saju-api-staging` 생성
4. Worker 코드로 `worker-v6.0-final-launch-preview.js` 사용
5. D1 binding 이름을 정확히 `DB`로 연결
6. 기존 `OPENAI_API_KEY`는 Secret으로 연결
7. 아래 일반 변수를 staging Worker에 설정
   - `ENVIRONMENT=staging`
   - `AI_CHAT_ENABLED=true`
   - `NEW_PAYMENTS_ENABLED=false`
   - `SERVER_WALLET_ENABLED=false`
   - `SERVER_FREE_QUOTA_ENABLED=false`
   - `CLIENT_AUTHORITY_MODE=SHADOW`
8. `FINAL_CODE_GATE_VERIFIED=true`는 GitHub 최종 site-check 성공을 확인한 뒤 staging에만 설정 가능
9. 실제 PG/로그인 키는 아직 연결하지 않음
10. 배포 후 `/health` 확인
11. `/api/staging/readiness` 확인
12. `/api/final-launch/readiness`는 `launchReady=false`가 정상
13. guest session 생성 → usage 읽기까지 테스트
14. 이후 프로필/대화/명식/AI까지 단계적으로 확장

## 자동 Smoke
환경변수에 staging URL을 넣고 아래 파일을 실행하면 됩니다.

`GUIIN_STAGING_BASE_URL=https://... node staging-e2e-smoke.mjs`

검사 항목:
- `/health`
- `/api/staging/readiness`
- `/api/final-launch/readiness`가 아직 BLOCKED인지
- 게스트 세션 생성
- 게스트 무료횟수/지갑 조회

## 절대 아직 켜지 않는 것
- `NEW_PAYMENTS_ENABLED=true`
- 실제 PG 결제
- 실제 INICIS webhook 성공 처리
- production server authority 전환
- SERVER 모드 강제 전환

Staging Smoke가 실제로 통과하기 전에는 `D1_STAGING_DEPLOYED`, `STAGING_E2E_PASSED`를 PASS로 바꾸지 않습니다.
