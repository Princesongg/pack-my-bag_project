# 공통 모달 하단 모서리 수정

2026-10-25. 모바일 공통 `.pmb-brief-modal` 규칙이 `border-radius: var(--pmb-radius-modal) var(--pmb-radius-modal) 0 0`을 지정해 확인 팝업과 모든 상세 모달의 하단을 직각으로 만들고 있었습니다.

`src/service/my-bag/TripBriefModal.css`의 해당 규칙만 수정했습니다.

- 네 모서리 모두 기존 `--pmb-radius-modal`(20px) 사용.
- 모바일 공통 모달은 좌우12px·하단최소12px의 여백. 하단은 safe-area를 고려하고 max-height도 같은 여백을 제외하여 계산.
- 확인 팝업의 기존480px 최대너비·중앙 배치는 유지. 다른 모바일 상세 팝업은 하단 배치 유지.
- 기존 `overflow-y:auto`와 sticky 헤더로 긴 콘텐츠를 스크롤. 둥근 스크롤 컨테이너가 내부 배경을 클리핑하므로 별도 wrapper/overflow:hidden을 추가하지 않음.
- 문구·버튼·이동·미완료 판정·저장·애니메이션 로직 변경 없음. 배포 없음.

실제 Chrome 검사:1440×900,1024×768,768×600,430×700,390×600,375×600,360×600,640×360. 날씨·전압·항공·비자·여권/RED FLAGS·마지막 점검 확인의6종, 총48건.

네 모서리 동일한 양의 radius, 뷰포트 경계, 가로 넘침, 긴 모달 끝까지 스크롤한 뒤 닫기 버튼 접근, 확인 팝업의 ‘준비물 더 확인하기’와 ‘마지막 점검으로 이동’을 실행해 통과했습니다. 런타임 예외0. TypeScript/Vite 빌드 통과.

390px 확인 팝업은 수정 전20/20/0/0px → 수정 후20/20/20/20px이며, 기존 중앙 위치와 크기는 동일했습니다. [수정 후 캡처](verification/modal-corners/after-confirm-390.png)를 직접 확인했습니다. [변경 전 측정](verification/modal-corners/before.json), [변경 후48건](verification/modal-corners/after.json).

추가한 브라우저 검사: `scripts/verify_modal_corners.mjs`. iOS/Android 실기기 및 실제 safe-area 장치 검사는 미실행이며 Chrome viewport 검사입니다.
