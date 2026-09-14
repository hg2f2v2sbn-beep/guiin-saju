# 귀인사주 보안 하드닝 v2

지금은 파일만 준비합니다. Cloudflare 설정은 나중에 컴퓨터에서 합니다.

추가 보호:
- 세션 idle/absolute 만료
- 세션 폐기/토큰 교체 기준
- cookie 인증용 CSRF 기반
- 관리자 최근 MFA 확인
- 감사로그 hash chain
- 백업/복구훈련 기록
- 실결제 Launch Gate fail-closed

실결제는 인증, 세션보호, rate limit, secret 외부보관, 중복결제 방지, AI 무손실,
webhook/환불 복구, 감사로그 무결성, 백업 검증, 복구훈련, 법률, PG 검증이 전부 통과해야만 켭니다.
