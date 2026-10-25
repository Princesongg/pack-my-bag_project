# 반응형 레이아웃 정리

2026-10-25. 기존 React 화면과 디자인 토큰을 사용하며 별도 모바일 화면이나 기능을 추가하지 않았습니다.

## 적용

- `TripBrief.css`: 고정3열/768px 이하 일괄1열을 `repeat(auto-fit,minmax(min(100%,17rem),1fr))`로 교체. 가용 너비에 따라3→2→1열. 공통 카드 테두리·둥근 모서리·배경을 유지하고 좁은 화면에서 테두리를 제거하는 별도 카드 형태를 정리. 간격·패딩은12~16px 유동값. 자세히 보기의 `margin-top:auto` 유지.
- `MyBag.css`: 체크리스트 카테고리는 최소20rem 기준으로 자동2→1열 전환. 768px에서 강제1열이 되던 규칙 제거. 간격12~20px.
- `TripSetup.css`: 폼 패딩16~28px, 섹션 간격20~24px를 공통 `clamp()`로 관리. 날짜 피드백의 고정110px 최소높이를 세 줄 분량인4.8em(14px 기준67.2px)으로 줄임. 안내·오류를 위한 공간은 남겨 입력창의 위치를 유지하며, 내용이 더 길면 자연스럽게 늘어남. 날짜 입력54px, 국가/도시 버튼2열, 날짜480px 이하1열 규칙 유지.
- `STYLE_GUIDE.md`: 동일 DOM, 콘텐츠 기준 breakpoint, 검증 너비와 터치 영역 등 반응형 필수 원칙 기록.
- `verify_design_system_ui.mjs`: 기록용 phase 이름이 달라도 before 검사를 제외한 실행에는 실제 오버플로·터치 크기·애니메이션 assertion을 적용하도록 정리. 화면 높이·실제 brief 열 너비도 JSON에 기록.

모바일 전체 페이지 높이가 일정 비율로 줄었다고 주장하지 않습니다. 날짜 영역의 불필요한 최소 공간과 태블릿의 불필요한1열 적층을 줄이는 수정입니다. 콘텐츠·글자·SVG를 잘라 숨기는 처리는 추가하지 않았습니다.

## 검증

Chrome Headless 로컬 Vite, Desktop/Tablet/Mobile viewport 에뮬레이션.

- 변경 전 대표8너비의 화면 캡처 보존: `verification/design-system/responsive-before/`.
- 변경 후1440/1280/1024/768/430/390/375/360px와900/640/481/480px.14개 장면씩 총168건. 홈·시작·입력·MY BAG·날씨/전압/항공/전자기기/RED FLAGS 모달·PACK LESS·최종 확인·완료 흐름.
- 가로 스크롤, 모달 가로 넘침, 기후 수치 카드 넘침, 주요 모달/RED FLAGS/마지막 점검 버튼44px 터치 크기, 완료 애니메이션 검사.
- 날짜 별도 검사1440/768/390/320px: 빈 값·부분 입력·오류·정정·정상 제출에서 입력 높이54px·정렬 통과.
- 단위 테스트94개 통과. TypeScript 및 Vite 빌드 통과.

실행 결과: [responsive-after/ui-results.json](verification/design-system/responsive-after/ui-results.json), [날짜 검사](verification/date-layout/ui-results.json).768px MY BAG 캡처를 직접 확인했으며, 모든 화면의 모든 스크롤 위치를 육안 검사한 것은 아닙니다. iOS Safari·Android 실기기·OS 네이티브 달력은 미실행입니다. 기존 전체 기능 회귀 보고서는 이전 실행의 기록이며 이번에는 위 범위만 재실행했습니다.
