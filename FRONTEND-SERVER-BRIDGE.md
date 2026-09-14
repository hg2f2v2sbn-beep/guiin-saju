# 귀인사주 프론트-서버 연결 준비 v1

이번 단계는 현재 화면을 깨지 않고 서버 연결 준비만 하는 단계입니다.

추가된 것:
- `guiin-server-client.js` v2: 게스트/회원 세션, 사용량, 구매내역, 복원, AI 요청 공용 클라이언트
- `guiin-server-data-client.js` v2: 프로필/명식스냅샷/대화 서버 API
- `guiin-frontend-bridge.js`: 서버 무료횟수/클로버/구매내역을 현재 UI 형식으로 변환

중요:
- 아직 `index.html`에 강제로 연결하지 않습니다.
- Cloudflare/D1이 실제 준비되기 전이라 현재 사이트 동작은 그대로 유지합니다.
- 실제 서버 연결 때는 localStorage 무료횟수/클로버를 서버 값으로 교체합니다.
- 서버가 응답하지 않으면 현재 화면을 망가뜨리지 않고 기존 동작을 유지합니다.

다음 실제 연결 순서:
1. Cloudflare/D1 staging 준비
2. 이 브리지를 index.html에 연결
3. 무료 3회/클로버 표시를 서버 값으로 전환
4. AI 질문 성공 후 서버가 `serverCharged`를 반환하는 흐름 확인
5. 구매복원/결제내역 연결
