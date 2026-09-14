# 귀인사주 26단계 — Cloudflare / D1 Staging 준비

운영 사이트를 바로 바꾸지 않고 별도 staging 서버에서 먼저 검증하기 위한 준비입니다.

안전 원칙:
- 운영 Worker는 아직 교체하지 않음
- 실결제 OFF
- 서버 클로버 차감 OFF
- 서버 무료 3회 최종차감 OFF
- PG 없음
- 비밀키는 GitHub에 저장하지 않음

컴퓨터에서 나중에:
1. D1 `guiin-saju-staging-db` 생성
2. `server-d1-init.sql` 실행
3. Worker D1 binding 이름 `DB`
4. `OPENAI_API_KEY`는 Secret으로 등록
5. `worker-v5.3-staging-preview.js`를 staging에 배포
6. `/api/staging/readiness` 확인
7. guest → usage → profile → conversation → chart snapshot → AI 순서 테스트
8. 결제/차감 플래그가 계속 OFF인지 재확인
