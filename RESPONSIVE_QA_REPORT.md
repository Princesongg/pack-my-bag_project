# PACK MY BAG — RESPONSIVE QA REPORT

검사일: 2026-10-25, Asia/Seoul. 실제 Windows Chrome Headless + Node CDP로 로컬 Vite 앱을 실행했습니다. 기존 도구를 사용했으며 새 라이브러리·API·서버·DB를 추가하지 않았습니다.

PASS는 이번에 실행해 통과한 검사, FIXED는 재현→수정→동일 조건 재검증 통과, NOT TESTED는 미실행입니다. 코드만 보고 PASS로 처리하지 않았습니다.

## 검사 범위

| 범위 | 실제 실행 |
|---|---|
| Desktop | 1920 / 1440 / 1280px |
| Tablet | 1024 / 820 / 768px |
| Mobile | 430 / 390 / 375 / 360px |
| 전체 화면 | 각 너비에15장면 + 열린 모달16단계 리사이즈 =166개 화면 기록 |
| 낮은 화면·가로 모드·비자·긴 물품명 | 1920×1080,820×600,768×400,430/390/375/360×600,844×390,640×360.9조건×12장면=108개 기록 |
| 촘촘한 너비 변경 | MY BAG1920→360px,20px 간격79단계, 높이600px |
| TRIP INPUT | 1440/1280/1024/768/430/390/375/360/640/481/480px에서 선택 전·선택 후·복원 및 검색·변경·새로고침 |

전체 화면15장면: 프로젝트 홈, 기획 화면, START SCREEN, TRIP INPUT 선택 전·선택 후, MY BAG, 날씨·전압·항공·전자기기 상세, RED FLAGS/여권, PACK LESS, 최종 이동 확인, LAST MINUTE BAG, 완료.

START→TRIP INPUT→날짜/목적/수하물 입력→MY BAG 생성→각 모달→PACK LESS→마지막 점검→비행기 애니메이션·완료를 실제 클릭했습니다. 기본 시나리오는 나트랑으로 누락 기후 지표 UI를 포함하고, 추가 검사는 미국 LA로 비자 배너·비자 모달·긴 영문 도시명과 개인 물품을 포함했습니다. 이번에 모든 국가·도시의 전체 기능을 다시 전수 검사한 것은 아닙니다.

## 발견 오류 및 수정

| ID | 우선순위 | 재현·원인 | 수정 | 결과 |
|---|---|---|---|---|
| RWD-01 | P2 | 모달을1440px에서 연 뒤1200→360px로 줄이면, 스크롤 잠금용 body 너비가 열 당시의 픽셀값으로 고정되어 배경 카드·액션이 창 밖으로 남음. 모달 자체의 닫기 버튼은 접근 가능했음 | 기존 스크롤바 간격을 보존하는 `calc(100% - gutter)`로 body 너비 지정. 뷰포트 변경에 따라 같은 배경 레이아웃이 다시 계산됨 | FIXED |
| RWD-02 | P1 | 공백 없는 긴 영문 사용자 물품명이 Grid 자식 li의 자동 최소 너비를 확장.360px에서 삭제 버튼이 문서 좌표516~560px로 밀림. 행으로 스크롤한 캡처에서 실제 잘림 발견 | 체크리스트 li에 `min-width:0`, 물품명 span에 `overflow-wrap:anywhere`. 글자를 자르지 않고 행 높이가 자연스럽게 늘어나도록 수정. 모든 화면에서 컨트롤 가로 경계를 직접 검사하는 assertion 추가 | FIXED |

수정 전16단계 리사이즈에서 배경 요소 가로 이탈105건, 수정 후0건.105개 별도 오류가 아니라 동일 원인의 반복 측정입니다. 최초부터 페이지/모달 자체의 가로 스크롤은0건이었으며, 이번 수정은 overflow로 문제를 감추는 처리가 아닙니다. 기존 모달 배경 스크롤 잠금과 닫은 뒤 스크롤·포커스 복구를 유지했습니다.

RWD-02는 document 너비 검사만 통과해도 중첩된 Grid 자식·버튼이 이탈할 수 있음을 보여줬습니다. 최초 추가 검사에서는 컨트롤 좌표를 기록만 했고, 캡처 검토로 오류를 발견한 뒤 개별 컨트롤 경계도 실패 조건에 넣어 재검증했습니다. [긴 물품명 수정 전 캡처](docs/verification/responsive-edge/long-item-before-360.png)와 [수정 후 캡처](docs/verification/responsive-edge/long-item-360-600.png)를 보존했습니다.

수정 후360px 삭제 버튼의 문서 가로 좌표는279~323px, 크기44×44px입니다. 추가 검사108장면에서 기록한 input/select/button의 가로 경계 실패는0건입니다. 긴 물품명의 실제 줄바꿈과 삭제 버튼 노출도 캡처로 확인했습니다.

이 외 재현된 P0 또는 추가 수정이 필요한 P1/P2/P3 오류는 없었습니다. 정상 레이아웃을 임의로 다시 디자인하거나 미디어 쿼리를 무리하게 재작성하지 않았습니다.

## 수정 파일

- `src/service/my-bag/ServiceModal.tsx`: 배경 잠금 너비1곳만 수정. 카드 CSS·애니메이션 로직·입국/여권 역할·국가 데이터·저장 스키마는 변경하지 않음.
- `src/service/my-bag/MyBag.css`: 긴 물품명과 Grid 항목의 축소·줄바꿈만 수정. 기존 카드 크기·체크 상태·삭제 로직 유지.
- `scripts/verify_responsive_qa.mjs`: 전체 장면·10너비·모달16단계 리사이즈, 버튼 크기·가로 이탈·안정된 모달 경계 검사.
- `scripts/verify_responsive_edges.mjs`: 낮은 화면·긴 이름·비자/여권·모달 바닥 스크롤/닫기·포커스·79단계 연속 축소 검사.
- 이 보고서 및 `docs/verification/responsive-final/`, `responsive-edge/`의 JSON·캡처. 기존 `trip-disclosure` 검사 결과도 재실행으로 갱신.

## 항목별 결과

| 항목 | 결과·검사 내용 |
|---|---|
| 콘텐츠 너비/중앙 정렬 | PASS — 공통 최대 너비 유지, 주요 컨트롤 가로 경계 검사.1920px에서 내용을 무리하게 화면 전체로 늘리지 않음 |
| START SCREEN | PASS — 대표 너비와 낮은 가로 화면. 스크롤로 버튼 접근 가능하며 짧은 높이에 전체 콘텐츠를 억지로 한 화면에 넣지 않음 |
| TRIP INPUT | PASS — 모바일 요약·변경·검색·국가 변경 시 도시 초기화, PC 카드 표시 유지, 모바일↔PC 변경 중 선택 보존, 날짜54px·기간 계산·MY BAG 생성·새로고침 복원 |
| 제목·설명·여행 요약 | PASS — PC/태블릿/모바일 캡처 및 너비 검사. 기존 정보 삭제 없음 |
| SMART TRIP BRIEF | PASS —1920/1440/1280/1024px에서3열,820/768px에서2열,430/390/375/360px에서1열.79단계 축소 중 카드 겹침·가로 스크롤 없음 |
| 수치·플러그 SVG·배지 | PASS — 기후 수치 카드 내부 넘침 없음. 기존 큰 SVG·타입·브랜드 배지 보존. 실제 캡처 확인 |
| 날씨/전압/항공/전자기기 모달 | PASS — 열기·닫기·공통 터치 크기·가로 경계, 날짜·수하물 데이터 유지 |
| 비자/여권/RED FLAGS 모달 | PASS — 미국 비자와 여권은 별도 화면 유지, 만료일/경유 select 너비, 긴 출처 펼치기·스크롤 바닥·닫기 접근·포커스 복귀 |
| 모달 낮은 높이 | PASS —768×400,844×390,640×360에서도 모달 최대높이와 고정 헤더가 뷰포트 안에 있음. 내부 스크롤로 출처까지 접근 |
| 체크리스트·직접 추가·긴 이름 | PASS — 긴 한국어/공백 없는 영문 물품을 실제 추가, 줄바꿈과 페이지 너비 확인. 삭제 버튼·입력 요소 가로 이탈 없음 |
| PACK LESS | PASS — 열기·레이아웃·스크롤. 이번에는 모든 추천 조합/제외 복원 조합을 새로 전수 실행하지 않음 |
| LAST MINUTE BAG | PASS — 체크리스트 완료·실제 비행기 CSS 애니메이션·완료 문구.360px 캡처에서 비행기와 문구가 카드 안에 표시됨 |
| 주요 조작 영역 | PASS — 전체 화면 버튼44px 기준, 좁은 모달 닫기·RED FLAGS·마지막 점검 버튼 검사. 모든 링크 텍스트가44px 박스라는 뜻은 아님 |
| 저장 | PASS — 체크 상태 새로고침 복원, 입력 선택/날짜 복원. 사용자 실제 브라우저 저장소는 변경하지 않고 전용 테스트 프로필 사용 |

## 실제 화면 검토 및 증거

대표 캡처를 직접 열어 PC1440px MY BAG, 태블릿820px 선택 완료 입력, 모바일360px 완료,360×600 비자 모달의 출처 영역,640×360 시작 화면을 확인했습니다. 긴 물품명은 해당 행으로 스크롤한 캡처도 남겼습니다. 모든 장면의 모든 스크롤 위치를 육안 검사했다고 주장하지 않습니다.

- [전체 화면 수정 전 JSON](docs/verification/responsive-final/before/ui-results.json)
- [전체 화면 수정 후 JSON](docs/verification/responsive-final/after/ui-results.json)
- [수정 전 요소 이탈](docs/verification/responsive-final/before/issues.json)
- [수정 후 요소 이탈](docs/verification/responsive-final/after/issues.json)
- [낮은 화면·비자·긴 이름·79단계 결과](docs/verification/responsive-edge/results.json)
- [입력 요약 회귀 결과](docs/verification/trip-disclosure/after.json)
- [PC MY BAG 캡처](docs/verification/responsive-final/after/my-bag-1440.png)
- [태블릿 입력 캡처](docs/verification/responsive-final/after/setup-selected-820.png)
- [모바일 완료 캡처](docs/verification/responsive-final/after/complete-360.png)
- [모바일 비자 모달 캡처](docs/verification/responsive-edge/entry-bottom-360-600.png)

기하학적 모달 경계는 열림 애니메이션이 끝난 뒤 측정했습니다. 초기 시험에서 열림 애니메이션 진행 중 약1~3px의 translateY를 최종 위치로 오인할 수 있어, 최종 검사는230ms 대기 후 수행했습니다. 애니메이션을 앱에서 제거하거나 위치를 임의 보정하지 않았습니다.

## 실행 및 빌드

```powershell
$env:DESIGN_PHASE='after'
$env:DESIGN_WIDTHS='1920,1440,1280,1024,820,768,430,390,375,360'
node scripts/verify_responsive_qa.mjs
node scripts/verify_responsive_edges.mjs
node scripts/verify_trip_disclosure_ui.mjs
node --test tests/*.test.mjs
npm.cmd run build
```

- 실제 Chrome 브라우저 실행: PASS. 콘솔 런타임 예외0.
- 단위/모델 테스트:94 PASS,0 FAIL.
- TypeScript와 Vite 프로덕션 빌드: PASS. 샌드박스의 기존 빌드 경로 제한을 피하기 위해 승인된 동일 빌드 명령을 사용.
- 검증에서 신규 유료·종량제 서비스·외부 이미지/API 연결 없음. 운영 배포는 수행하지 않음.

## 남은 한계 / NOT TESTED

- iOS Safari·Android 실기기, 브라우저별 날짜 팝업·OS 키보드·주소창 높이 변화와 실제 화면 회전 센서: NOT TESTED. 가로/세로 viewport 크기를 변경한 Chrome 검사임.
- 스크린리더 음성·전체 WCAG 인증·모든 링크의 색상 대비 전수 측정·모든 애니메이션 프레임 육안 검토: NOT TESTED.
- 모달16단계 리사이즈와 MY BAG20px 간격79단계는 촘촘한 표본 검사이며 가능한 모든 실수 너비의 수학적 보증이 아님.
- 모든 국가 조합·정부 규정 최신 원문·정부 승인 시스템·실제 항공사 허용량은 이번 디자인 QA 범위가 아님. 기존 검증/미검증 상태 유지.
- 현재 최종 실행 범위에서 남아 있는 재현 가능한 반응형 FAIL은0건. 새로운 페이지·MY TRIPS·로그인·내보내기 기능을 추가하지 않음.
