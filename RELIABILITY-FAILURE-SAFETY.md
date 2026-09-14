# 귀인사주 장애/복구 안전성 v1

이번 단계는 '문제가 생겼을 때 돈·데이터를 잃지 않게' 만드는 운영 안전장치입니다.

핵심:
- 결제는 기본 OFF
- 유지보수/읽기전용/AI중지/결제중지 모드
- 일정 횟수 이상 연속 오류가 나면 circuit breaker 기준으로 차단
- 장애를 transient / throttle / security / data_integrity / business_rule로 분류
- 자동 재시도는 일시적 장애에만 허용
- 돈이 걸린 오류와 개인정보 위험은 critical
- 새 버전 이상 시 안전 롤백 조건을 명확히 기록
- 지갑/무료횟수/주문/AI 저장 상태의 무결성 점검 항목 고정
- Launch Gate 실패 시 실결제는 계속 OFF

나중에 컴퓨터로 실제 연결할 때:
1. service_state 초기값 넣기
2. 백업/PITR 확인
3. restore drill 실행
4. 장애 알림 연결
5. v4.8 preview를 staging에서 먼저 검증
6. 실제 결제는 마지막에만 활성화
