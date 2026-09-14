# 귀인사주 28단계 — PG 테스트 / Webhook 서명검증 준비

실결제를 켜는 단계가 아닙니다.

완성:
- PG adapter 공통 구조
- 서버 주문금액/통화 재검증
- mock webhook HMAC-SHA256 서명검증
- 중복 webhook idempotent 처리
- 서명 실패 시 fail-closed
- 실제 INICIS 서명검증은 공식 규격 확인 전까지 의도적으로 차단

`NEW_PAYMENTS_ENABLED`는 계속 OFF입니다.
`PG_TEST_WEBHOOK_SECRET`은 GitHub가 아니라 Cloudflare Secret에만 저장합니다.
