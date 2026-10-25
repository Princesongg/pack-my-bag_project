# PACK MY BAG — E2E REGRESSION REPORT

실행일: 2026-10-25 (Asia/Seoul). 기존 기능의 실제 브라우저 회귀 검사이며, 새로운 기능이나 국가 규정을 추가하지 않았습니다.

## 판정 및 환경

- PASS: 이번 실행에서 실제 통과.
- FIXED: 오류 수정 뒤 동일 조건 재검증 통과. 과거 FIXED 항목도 이번 결과는 별도로 기록.
- FAIL: 이번 실행에서 남은 실패.
- NOT TESTED: 실행하지 않은 항목. 코드 검토로 PASS를 대신하지 않음.

Windows Chrome Headless, 로컬 Vite `http://127.0.0.1:5173`, Node CDP 자동화를 사용했습니다. 테스트 전용 Chrome 프로필만 사용했으며 사용자 브라우저 저장소는 건드리지 않았습니다. 입력은 React 화면의 실제 입력 요소에 값과 input/change 이벤트를 전달하고 버튼·키보드를 실행했습니다. OS 달력 팝업 자체를 누르는 검사는 아닙니다. 화면 검사는 DOM 치수·오버플로·computed style과 캡처를 사용했습니다. 모든 스크롤 위치를 육안 검사했다는 뜻은 아닙니다.

## 기존 자료와 우선 재검증

| 자료 | 실제 현황 |
|---|---|
| E2E_QA_REPORT.md | 존재. QA-01 사용자 ESTA 항목 삭제 후 공통 항목 미복원, 동일 역할 중복 생성의 과거 FIXED 기록 확인 |
| E2E_REGRESSION_REPORT.md | 작업 시작 시 없음. 이번에 작성 |
| COUNTRY_DATA_AUDIT.md / COUNTRY_DATA_FIXES.md | 존재. 최초 감사와 후속 P0·P1 수정 기록을 함께 확인 |
| Git 변경 내역 | 이 폴더는 Git 저장소가 아님. `git status --short` 실패. 커밋 이력 대조 불가 |
| 기존 테스트 | `tests/*.test.mjs`, 브라우저 QA·날짜·여권·비자·국가 데이터 검사 스크립트 존재 |

| 기존 오류·변경 | 과거 상태 | 이번 실제 재검증 |
|---|---|---|
| QA-01: 기존 사용자 ESTA 항목 삭제 뒤 공통 항목 복원 | FIXED | PASS — 삭제 직후 공통 항목·개인 확인 상태 복원, 여권 체크 보존 |
| ESTA 확인 항목 재추가 시 중복 | FIXED | PASS — 기존 역할 재사용, 중복 custom ID 없음 |
| 출발일·귀국일 높이와 오류 시 위치 | 이전 수정 | PASS — 빈 값·부분 입력·오류·수정, 54px 높이 및 2열 상단 좌표 검사 |
| 여권·비자 모달 중복 | 최근 분리 | PASS — 비자에는 date/select/여권 체크/입국신고 UI 없음. RED FLAGS에서 만료일·경유 조건 유지 |
| 전압·통화 요약 및 타국 출처 fallback | 이전 P1 수정 | PASS — 17도시 PC·모바일 연결, 요약/상세·플러그·출처 검사 |
| 누락 최고·최저값 및 통계 계열 혼합 표시 | 이전 P1 수정/누락 유지 | PASS — 기존 데이터와 지표 모델 비교, 검증된 값만 표시. 미등록값을 새로 만들지 않음 |
| 기내만 가능 / 위탁 금지 색상 차이 | 이전 수정 | PASS — 요약·상세·전자기기·RED FLAGS의 배경/글자/테두리 computed style 일치 |

## 6개국 전체 사용자 시나리오 — PASS

각 시나리오를 **1440 / 1024 / 768 / 390 / 360px**, 총 **30회** 실행했습니다.

| 국가·도시 | 일정 | 검증된 주요 차이 |
|---|---|---|
| 일본 도쿄 | 2027-04-10~04-13, 3박4일 | JPY, 100V, 비자 배너 없음 |
| 베트남 다낭 | 2027-07-10~07-14, 4박5일 | 여름 기후, VND, 220V, 비자 배너 없음 |
| 태국 방콕 | 2027-09-10~09-14, 4박5일 | 월별 강수, THB, C/O, 비자 배너 없음 |
| 대만 타이베이 | 2027-10-10~10-13, 3박4일 | TWD, 110V, A/B, 비자 배너 없음 |
| 미국 뉴욕 | 2027-12-29~2028-01-03, 5박6일 | 겨울·연도 경계 월별 탭, USD, ESTA 조건부 안내 |
| 호주 시드니 | 2027-12-10~12-15, 5박6일 | 남반구 여름, AUD, Type I, ETA 비자 안내 |

실제 흐름: START(Enter) → TRIP INPUT → MY BAG 요약 → 날씨/전압/항공 모달 → 해당 국가 비자 안내 → RED FLAGS → 물품 추가·삭제·체크 → 새로고침 → PACK LESS 적용·복원 → 100% 진행률 → LAST MINUTE BAG → 완료 → 새로고침·재점검.

- TRIP INPUT: 필수값 누락, 잘못된 귀국일과 오류 해제, 국가 변경 후 도시 초기화, 입력한 정상 도시 보존, 여행 기간 재계산.
- 요약: 도시·국가·날짜·박수/일수·통화·현재 시각, 기존 수하물/목적 입력 연결. 현지 시각은 여행일이 아닌 현재 시각 기준.
- 날씨: 조회 모델과 모달 수치 대조, 강수/최고/최저 누락 시 없는 숫자를 표시하지 않음, 뉴욕12월→다음 해1월 전환, 출처 존재.
- 전압: 국가별 main 값·SVG 타입 순서를 모델과 대조, 일본 이외 국가 전압 출처에 JNTO 혼입 없음.
- 항공: 내장기기/보조·여분/특수장비 구분, 100Wh 조건 문구 유지, 사용자 항공권 확인 허용량 저장. 테스트 입력 1개·23kg은 서비스 기본 규정이 아님.
- 체크리스트: ID 중복 없음, 직접 추가·삭제, 체크 복원, 실제 목록 기준100% 계산. PACK LESS 제외·복원 후 다른 물품 체크 보존.
- RED FLAGS: 여권·결제·항공 그룹 확인 후3개 중3개, 개인 확인 기록이 정부 승인이라는 표현 없음.
- 모달: 날씨 Tab 포커스 순환·Escape·트리거 복귀. 상세 팝업 열기·닫기, 가로 넘침 없음.
- LAST MINUTE: 체크/해제, checking→holding→flying→complete, 실제 비행기 CSS 애니메이션 확인, 최초 flying1회, 완료 제목 포커스. 새로고침 후 완료 보존·비행 재실행 없음. 다시 확인 후 해제·재체크 가능.

증거: [30회 journeys.json](docs/verification/e2e-regression/journeys.json), 같은 폴더 PC·모바일 MY BAG 및 완료 화면 캡처.

## 여권·비자·교차 변경 — PASS

- `verify_passport_ui.mjs`: 6개국×1440/390/320px =18회. 2026-12-17~12-20 / 만료2027-04-25에서 VN·TH·TW 미달, JP·US·AU 기본 날짜 충족.6개월 경계, 미확인 경유 시 추가 확인, 탭·닫기·새로고침 후 입력 초기화 확인.
- `verify_visa_separation_ui.mjs`: 6개국×1440/390/320px =18회. US/AU만 실제 배너 DOM 존재, 나머지는 빈 카드 없음. 비자 공식 링크·요약·포인트 대조, 여권 입력/계산 설명/여권 체크 없음. 확인 상태와 기존 항목 동기화·닫기 후 포커스 복귀.
- 새 `verify_e2e_regression_cross.mjs`: 1440/390px 각각7회 =14회. 실제 ‘여행 정보 변경’ 링크로 일본→미국→호주→베트남→태국→대만→베트남 변경. 요약·배너 갱신 확인. 만료2027-05-25를 임시 입력하면12월17일 입국 VN/TH/TW 미달, 베트남 입국일을11월17일로 변경 후 기본 조건 충족. 매번 만료일은 빈 값으로 시작하고 local/sessionStorage에 남지 않음.
- 비자 확인을 체크해도 여권 물품 체크는 false인 것을 전체 흐름에서 확인. 여권 만료일과 비자 확인 상태는 분리됨.
- `none`은 단기 관광 기본 배너의 숨김 값이며 개인의 무비자 자격 확정이 아님. 기존 RED FLAGS의 범위 확인·입국신고·추가 확인 안내와 원본 규정은 유지. 출장·장기체류·국적/비자 예외의 정부 판정은 이번에 실행하지 않음.

증거: [여권](docs/verification/passport/ui-results.json), [비자](docs/verification/visa-separation/results.json), [교차 변경](docs/verification/e2e-regression-cross/results.json).

## 저장·개인정보·반응형 — PASS

| 실행 | 결과 |
|---|---|
| 새로고침 | 체크·사용자 물품·완료 상태 복원 |
| Chrome 프로세스 종료 후 동일 전용 프로필 재접속 | 저장소 전체 대조, 물품·여권 체크·완료 보존, 애니메이션 미재실행 |
| 기존 version1 사용자 입국 항목 alias | 복원·삭제 후 공통 역할 재생성·중복 방지 |
| 여행 국가 변경 후 원래 여행 복귀 | 별도 체크 격리, 원래 기록 복원. 다른 여행에 사용자 물품을 자동 복사하는 기능은 없음 |
| 손상된 trip JSON | 오류 없이 빈 TRIP INPUT으로 복구 |
| 임시 여권 만료일 | localStorage/sessionStorage에 입력값 없음. 닫기·탭·리로드 후 빈 값 |
| 여권번호·비자번호 | 입력 UI 없음. 기존 임의 사용자 물품 이름까지 민감정보 검사/삭제하는 기능은 이번 범위 아님 |
| 공통 화면 | 14장면×5너비=70건, 모달·수치·카드 오버플로와 주요 버튼 크기 검사 |
| 지원17도시 | 1440/390px=34회, 기후·전압·통화·연결·출처 |
| 실시간 시계 | 실제 분 경계를 기다려 IANA 계산과 전후 값 대조 |
| DST | 단위 테스트에서 미국·호주 겨울/여름·전환 경계 계산 실행. 실제 시스템 날짜를 DST일로 변경하는 검사는 하지 않음 |

증거: [재접속](docs/verification/e2e-regression/restart-result.json), [저장 예외](docs/verification/e2e-qa-edges/results.json), [70장면](docs/verification/design-system/regression/ui-results.json), [17도시](docs/verification/country-data-fixes/ui-results.json), [시계](docs/verification/e2e-qa-clock/result.json), [날짜](docs/verification/date-layout/ui-results.json), [배지](docs/verification/baggage-labels/badge-colors.json).

## 새 오류·변경 파일

이번 최종 브라우저 실행에서 재현된 서비스 오류 및 미해결 FAIL은 **0건**입니다. 정상 코드를 불필요하게 수정하지 않았습니다. 국가 데이터·스타일·localStorage 스키마는 변경하지 않았습니다.

- 추가: `scripts/verify_e2e_regression.mjs` — 기존 전체 흐름 검사에서 폐기된 ‘모든 국가 입국 배너/입국신고 체크’ 가정을 최신 US/AU 비자 전용 UI에 맞춤. 다낭4박5일·타이베이3박4일 시나리오 반영.
- 추가: `scripts/verify_e2e_regression_cross.mjs` — 실제 변경 폼을 통한 국가·입국일 변경 및 여권 결과 검사.
- 추가: 이 보고서와 실행 JSON·스크린샷. 기존 검증 스크립트 재실행으로 해당 결과 파일도 갱신됨.
- 서비스 `src` 파일 수정 없음. 기존 `verify_e2e_qa.mjs`와 과거 입국배너 검사는 역사적 시점의 검사이며 최신 비자 노출 회귀 명령으로 사용하지 않음.

테스트 작성 중 중복 변수·PowerShell 파이프의 한글 인코딩 문제를 수정했습니다. 교차 검사 초기 과거 날짜는 입력폼에서 정상 차단됐고,11월 입국의6개월 경계를 잘못 기대한 테스트 만료일도 정정했습니다. 이 중간 실행을 앱 FAIL이나 최종 PASS로 집계하지 않았습니다. 최종 교차14건은 처음부터 재실행해 모두 통과했습니다.

## TypeScript·빌드 및 명령

- `node --test tests/*.test.mjs`: **94 PASS, 0 FAIL**.
- `npm.cmd run build`: **PASS**, TypeScript 및 Vite1699모듈 빌드. 첫 실행은 샌드박스 상위 경로 접근 제한으로 Vite 설정 읽기가 차단됐으며, 동일 명령을 권한 제한 밖에서 재실행해 성공. 앱 컴파일 오류로 분류하지 않음.
- `node scripts/verify_e2e_regression.mjs`:30회 PASS.
- PowerShell `$env:QA_RESTORE_ONLY='1'; node scripts/verify_e2e_regression.mjs`: 프로세스 재접속 PASS.
- `node scripts/verify_e2e_regression_cross.mjs`, `verify_e2e_edges.mjs`, `verify_passport_ui.mjs`, `verify_date_layout_ui.mjs`, `verify_visa_separation_ui.mjs`, `verify_country_fixes_ui.mjs`, `verify_baggage_labels_ui.mjs`, `verify_e2e_clock.mjs`: 모두 최종 정상 종료. 각각 `node scripts/파일명`으로 실행.
- PowerShell `$env:DESIGN_WIDTHS='1440,1024,768,390,360'; $env:DESIGN_PHASE='regression'; node scripts/verify_design_system_ui.mjs`:70건 PASS.

## NOT TESTED / 남은 확인 사항

- iOS Safari·Android 실기기, OS 네이티브 달력, 실제 스크린리더 음성, 모든 프레임의 깜빡임·모든 스크롤 위치 육안 검사, 전체 WCAG 인증은 NOT TESTED.
- 정부 사이트의 실제 신청·결제·승인 조회, 실제 항공사 시스템과 운임별 허용량은 NOT TESTED. 공식 URL의 화면 매핑을 검사했으며 외부 정부 페이지의 최신 원문을 이번에 전면 재검증하지 않았음.
- 태국 한국 여권 체류기간 자료 차이, 베트남 PAI 공항별 적용, 호주 ATD 항공편별 적용 및 일부 동적 공식 페이지 자격은 기존 추가 확인 상태 유지. 기후 감사의 미등록72칸/통계 계보 미검증도 새 공식값으로 채우지 않음.
- 숨겨진 비자 배너는 개인별 비자 면제나 최종 입국 허가를 보증하지 않음. 예외 여행자는 공식 안내에서 확인해야 함.
- 운영 배포 환경 검사는 NOT TESTED. 이번은 로컬 개발 앱 검사이며 유료·종량제 API, 신규 서버/DB, 신규 UI 라이브러리 사용 없음.
