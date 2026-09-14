# 귀인사주 보안 하드닝 v1

현재 파일은 실제 결제/보안 스위치를 즉시 켜기 위한 것이 아니라, 서버 배포 전 적용해야 할 보안 기준을 코드와 테스트로 고정합니다.

## 현재 적용 준비
- Origin allowlist: gwiinsaju.com / www.gwiinsaju.com / GitHub Pages 데모만 허용
- API JSON 응답에 no-store, nosniff, frame deny, no-referrer, restrictive CSP
- 요청 본문 크기 제한
- POST/PUT/PATCH의 Content-Type 검증
- route별 rate limit 정책
- 개인정보/토큰/결제식별자 로그 마스킹
- 관리자 API는 기본적으로 존재하지 않으며, 향후 user allowlist + MFA 뒤에만 추가
- 결제/서버 차감은 계속 OFF

## Cloudflare에서 나중에 할 것
1. `api.gwiinsaju.com` custom hostname 사용을 우선 권장합니다.
2. D1 binding `DB`를 연결합니다.
3. `SECURITY_HASH_SECRET`을 Secret으로 생성합니다. GitHub에 절대 저장하지 않습니다.
4. 실제 회원 인증을 붙인 뒤 `SECURITY_ENFORCEMENT_ENABLED=true`를 켭니다.
5. Rate limiting은 Cloudflare WAF/Rate Limiting Rules도 함께 사용합니다.
6. 관리자 경로는 Cloudflare Access 또는 별도 MFA 뒤에 둡니다.
7. PG 비밀키는 Secret으로만 보관합니다.

## Launch Gate
아래 항목 중 하나라도 실패하면 실결제를 켜지 않습니다.
- 인증 없이 개인 프로필/구매/대화 조회 가능
- 임의 Origin에서 API 호출 가능
- 결제 금액을 브라우저 값으로 신뢰
- 로그에 이름/생년월일/전화번호/e-mail/token 원문이 기록
- 동일 idempotency key가 중복 지급/중복 차감을 발생
- AI 실패 시 무료횟수/클로버 손실
- webhook 재전송이 중복 구매권한/클로버 지급
- 환불 뒤 권한/클로버 복구 상태가 불일치
- API secret 또는 PG key가 저장소에 존재
