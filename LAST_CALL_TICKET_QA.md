# LAST CALL 여행 티켓 개선

2026-10-27. 기존 여행 요약을 보딩패스에서 영감을 받은 TRAVEL PASS로 변경했습니다. 실제 항공권/예약 기능은 없습니다.

## 구현

- PC는 목적지/날짜·기간 약70:30 Grid. PACK MY BAG·TRAVEL PASS·DESTINATION 라벨, 기존 실제 도시·국가 정보, 짧은 점선과 비행기 아이콘을 표시합니다.
- 기존 실제 출발일 및 recalculateTrip의 여행 기간을 그대로 사용합니다. 국가명/도시 표시명을 조회 키로 바꾸거나 임의 항공편·좌석·게이트·시간·공항·예약번호를 만들지 않았습니다.
- 오른쪽 날짜/기간 영역의 경계를 기준으로 점선과 반원형 홈을 배치했습니다. PC는 위/아래, 768px 이하에서는 가로 절취선과 양옆 홈으로 바뀝니다. 반원 홈은 페이지 배경색이며 장식에 의해 가로 스크롤이 생기지 않도록 반원만 표시합니다.
- 딥 네이비 CSS 바코드는 반복 패턴일 뿐 개인정보·예약 데이터를 인코딩하지 않으며 aria-hidden입니다. 비행기·점선도 장식으로 숨겼습니다.
- 버터 옐로·네이비·기존 블루와 골드 점선 및 기존 radius 유지. 오해 방지를 위해 `여행 준비용 · 실제 항공권이 아닙니다`를 표시합니다.
- LAST CALL의 다른 영역과 체크리스트·완료 애니메이션·날짜 계산 로직은 변경하지 않았습니다.

## 검사

Chrome·Windows WebKit 각각 1920/1440/1280/1024/820/768/430/390/375/360/320px, 오사카 및 긴 도시명 로스앤젤레스 두 조건. 총44개 엔진/너비/여행 조합을 검사했습니다.

| 항목 | 결과 |
|---|---|
| 국가·도시·출발일·기간 | PASS — 서로 다른 국가/도시/월 조건을 번갈아 로드하고 실제 여행값과 화면 대조 |
| 긴 도시명·가로 넘침 | PASS — 320px 포함 페이지/티켓 overflow 없음, 임의 ellipsis 없음 |
| 절취선·반원 홈 | PASS — 부모 날짜 영역에 상대 배치, 방향별 좌표와 점선 확인, PC/모바일 캡처 직접 검토 |
| 카드 높이 | PASS — 기존 CSS/마크업으로 재구성한 동일 브라우저 기준과 비교. PC1440 약168→189px, 모바일390 약206→233px. 내용 자르기나 고정 높이 없음 |
| 체크리스트 완료·새로고침 | PASS — 양 엔진1440/390px에서 실제 체크→일반 모션 완료→ALL SET 확인, reload 후 완료 상태 복원·비행 재실행 없음 |
| 단위 테스트 | PASS — last-minute/trip 9개 |
| JS·Console | PASS — 수집한 예외·console.error 0 |
| 최종 빌드 | PASS — TypeScript/Vite npm.cmd run build |
| 실제 iOS/Android·native Safari UI | NOT TESTED — Windows WebKit은 실제 iOS Safari가 아님 |
| 모든 도시·일정·동일 편집 폼에서 변경 순간 | NOT TESTED — 두 대표 여행의 재로드 검사, 컴포넌트는 기존 trip props에서 직접 렌더링 |
| Production 배포 후 검증 | NOT TESTED — 이번에 커밋·푸시·배포하지 않음 |

수정 파일: `src/service/my-bag/LastMinuteScreen.tsx`, `src/service/my-bag/LastMinuteScreen.css`. 검증 도구: `scripts/verify_last_call_ticket.mjs`. 이전 스타일은 높이 비교를 위한 로컬 QA 캐시에 보관했습니다.

근거: [44개 검사 결과](docs/verification/last-call-ticket/results.json), [PC](docs/verification/last-call-ticket/chrome-1440-osaka.png), [모바일](docs/verification/last-call-ticket/chrome-390-osaka.png), [320px 긴 도시명](docs/verification/last-call-ticket/chrome-320-los-angeles.png).
