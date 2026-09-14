# 귀인사주 출시 전 통합검증 v1

이번 단계는 지금까지 만든 엔진·AI·회원·돈·결제·보안·복구를 한 번에 보는 Launch Gate입니다.

원칙:
- required gate 하나라도 FAIL/MISSING이면 실결제 OFF
- legal_ready, pg_verified도 코드 테스트와 동일하게 필수
- 현재는 실제 PG와 법률 최종확정 전이므로 정상적으로 launch-ready가 아니어야 함
- GitHub CI가 PASS라고 해서 실결제를 켜는 것이 아님
- staging에서 D1/Cloudflare/PG까지 실제 연결한 후 Launch Gate를 다시 실행해야 함

필수 카테고리:
1. 계산 정확성
2. 해석/궁합/운 흐름
3. AI 품질/중복/무손실
4. 인증/소유권/구매복원
5. 무료횟수/클로버
6. 주문/결제/환불/webhook
7. 보안
8. 감사/백업/복구
9. 법률/PG 실검증
