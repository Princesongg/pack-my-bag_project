# PACK MY BAG — MODAL QA

검사일:2026-10-26 (Asia/Seoul). 로컬 Vite 앱을 실제 Windows Chrome Headless에서 검사했습니다. **현재 실행 범위에서 앱 오류는 발견되지 않아 공통 모달·스타일·데이터 코드를 수정하지 않았습니다.** 새 기능·서버·API·라이브러리 추가 및 Production 배포 없음.

상태: PASS=이번 실제 동작 확인, FIXED=앱 오류 수정 후 재검증 통과, FAIL=남은 오류, NOT TESTED=미실행. 이번 결과에 앱 FIXED는 없습니다.

## 1. 실제 모달 목록과 구조

실행 코드의 `<dialog>`, `showModal`, `createPortal`, 모달 호출부를 조사했습니다. 원본 자료를 보관한 `data/raw/*.html`의 외부 사이트 dialog는 앱 실행 모달로 집계하지 않았습니다.

| 실제 모달 | 구현/내부 화면 | 결과 |
|---|---|---|
| 날씨·옷차림 | `TripBriefModal`→`WeatherGuide`, 여행 월 탭 | PASS |
| 전압·플러그 | `TripBriefModal`→`ElectricityInfo`, 현지 통화 포함 | PASS |
| 항공 수하물 | `TripBriefModal`→`BaggageGuide` / `BaggageAllowanceForm` 탭 | PASS |
| 비자·전자여행허가 | `EntryPreparationBanner`, 미국ESTA/호주ETA | PASS |
| PACKING RED FLAGS | `PackingRedFlags`의 `RedFlagsModal` | PASS |
| 마지막 점검 이동 확인 | `FinalCheckCTA` | PASS |

모두 **단일 공통 `ServiceModal`의 native dialog**로 표시됩니다. `TripBriefModal`은 콘텐츠 조합용 래퍼이며 별도의 이중 dialog가 아닙니다.

- 여권 `PassportCheck`, 결제 카드 점검, 항공 반입 RED FLAGS는 하나의 RED FLAGS 모달 안에서 바뀌는 화면입니다.
- 보조/여분 배터리·액체류·전자기기·날카로운 물품·에어로졸 상세는 항공 모달 내부의 접이식 패널입니다. 각각의 열기·내부 닫기·트리거 포커스 복귀도 검사했습니다.
- 내 수하물 허용량은 항공 모달 내부 폼입니다.
- PACK LESS는 페이지 내 펼침 영역으로 별도 Modal/Dialog가 없습니다. 체크리스트 아코디언도 모달이 아닙니다.
- 실행 TS/TSX에서 별도의 native alert/confirm/prompt 흐름은 확인되지 않았습니다.

## 2. 디자인·반응형·공통 동작

공통 스타일은 `TripBriefModal.css`, 모서리는 기존 `--pmb-radius-modal`, 배경·테두리·본문·배지 스타일은 기존 토큰/공통 컴포넌트를 사용합니다. 마지막 점검 확인 모달은 기존480px 최대너비를 유지하고 긴 정보 모달과 억지로 같은 크기를 만들지 않았습니다.

| 검사 | 결과 |
|---|---|
| 네 모서리 | PASS — 모든 측정에서 같은 양의 radius. 기존20px 토큰 유지, 하단 직각 재발 없음 |
| 모달 경계 | PASS — 좌우·상하가 viewport 내에 위치. 작은 높이에서도 max-height와 내부 스크롤 정상 |
| 내부 배경·모서리 | PASS — 긴 내용을 맨 아래로 스크롤한 뒤에도 모서리·닫기 버튼 유지. 대표 캡처 직접 확인 |
| 긴 콘텐츠 | PASS — 열린 details/출처를 포함해 scrollTop+clientHeight가 scrollHeight 끝까지 도달 |
| 닫기 헤더 | PASS — sticky 헤더·닫기 버튼이 접근 가능한 위치, 버튼 높이44px 이상 |
| 가로 넘침 | PASS — 모달·기후 수치 카드 가로 넘침 없음 |
| 배경 스크롤 | PASS — 모달 열림 시 body fixed/root 잠금, 종료 후 원래 스타일 해제 및 스크롤 좌표±1px 내 복구 |
| 반복 개폐 | PASS — 각 모달 닫기→다시 열기→닫기 후 잠금이 남지 않음 |
| 초기 포커스 | PASS — 열릴 때 dialog 내부로 이동 |
| 키보드 | PASS — 실제 Tab/Shift+Tab으로 마지막↔첫 컨트롤 순환, Escape 닫기 |
| 배경 클릭 | PASS — 실제 바깥 좌표 클릭으로 기존 정책에 따라 닫힘 |
| 닫기 후 포커스 | PASS — 원래 카드/배너/점검 버튼으로 복귀 |
| 제목 연결 | PASS — native dialog의 aria-labelledby가 실제 제목 요소를 참조 |

요청9너비:1440/1280/1024/820/768/430/390/375/360px. 기본 높이는 각각900/900/768/667/640/667/640/667/640px입니다. 추가640×360 가로 화면에서도 같은 검사를 실행했습니다.

전압 모달을 연 채1280→1100→1024→821→820→769→768→641→640→481→480→430→390→360→1440px로 바꾸는15단계 리사이즈도 실행했습니다. 총 **165개 콘텐츠/기하 스냅샷**이며, 재방문·내부 화면을 포함한 수입니다.165개 서로 다른 모달이라는 뜻은 아닙니다.

## 3. 내부 기능·데이터

| 항목 | 실제 실행과 결과 |
|---|---|
| 날씨 월별 탭 | PASS — 뉴욕2027-12-29~2028-01-03의2개 탭, 다음 해1월 선택 후 평균기온을 기존 정적 모델과 대조 |
| 기후 누락 처리 | PASS — 별도 지원17도시 검사에서 나트랑·푸꾸옥 등의 검증된 지표만 표시하는 기존 모델/UI 유지 확인 |
| 도시별 기후·전압·통화 | PASS —17도시×1440/390px=34회 기존 국가 데이터 연결 검사. source/지표/그림 연결 검사 포함 |
| 플러그 | PASS — 기존 SVG 존재·타입 목록 대조, 미국 전압 출처에 JNTO 혼입 없음. 한국 비교 출처는 해당 비교 영역으로 구분 |
| 항공5개 내부 상세 | PASS — 보조배터리·액체류·날카로운 물품·에어로졸·전자기기 열기/닫기. 내장기기·여분/보조·특수 장비3분류 확인 |
| 항공 배지 | PASS —1440/390px에서 요약·배터리 상세·전자기기·RED FLAGS의 배경/문자/테두리 computed style 일치 재실행 |
| 허용량 폼 | PASS — 테스트용 사용자 확인1개/23kg 입력·저장, 모달 닫고 다시 열어 값 복원. 이 수치를 실제 항공사 규정이나 기본값으로 추가하지 않음 |
| 여권 판정 | PASS —6개국×1440/390/320px=18회.6개월/체류기간 기준 구분·경유 미확인·경계일 검사 |
| 여권 개인정보 | PASS — 임시2030-11-23 입력값이 local/sessionStorage에 없음. 닫기·탭·새로고침 뒤 임시 입력 초기화는 의도된 기존 개인정보 정책 |
| 여권/비자 역할 분리 | PASS —6개국×1440/390/320px=18회. US/AU 비자 UI 존재, 다른4개국 기본 배너 없음. 비자 모달 안에 date/select/여권 체크 없음 |
| 비자 확인 | PASS — 직접 확인 체크→모달 닫기→재열기 후 체크 유지. 개인 확인이 정부 승인이라는 표현 없음 |
| RED FLAGS | PASS — 여권·결제·항공 탭 전환, 직접 점검 체크와 별도 여권 재검증. 상세 경고 유지 |
| 마지막 확인 팝업 | PASS — ‘준비물 더 확인하기’로 MY BAG 유지, 재열기 후 ‘마지막 점검으로 이동’으로 LAST MINUTE BAG 진입 |

공식 출처·관측 기간은 기존 앱 데이터와 화면 연결을 검사했습니다. **공식 사이트의 최신 원문과 국가 규정 자체를 이번에 전면 재검증한 것은 아닙니다.** 수치·시행일·확인일·안전 조건을 스타일 수정을 위해 바꾸지 않았습니다. 기존 미검증 정보도 임의로 VERIFIED로 승격하지 않았습니다.

저장 확인은 실제 저장한 허용량·개인 점검 체크에 대한 검사입니다. 제출하지 않은 모든 입력 초안을 영구 보존한다고 주장하지 않습니다. 여권 입력은 민감정보 보호를 위해 기존처럼 임시 사용합니다.

## 4. 오류 및 변경 파일

현재 최종 실행의 서비스 FAIL0건, 런타임 예외0. 모서리·스크롤·닫기·기능의 재발 오류가 없어 `src` 모달 컴포넌트나 CSS를 수정하지 않았습니다. 불필요한 리팩터링·새로운 디자인 변경 없음.

중간 리사이즈 검사에서 레이아웃 재계산 중의 scrollHeight를 읽어 바닥 도달 assertion이 실패했습니다. 앱 내용을 자르거나 스크롤을 변경하지 않고, 테스트에서 레이아웃 프레임이 안정된 후 다시 스크롤·측정하도록 보완한 뒤 전체 조건을 처음부터 재실행해 통과했습니다. 이 테스트 보완을 앱 FIXED로 집계하지 않았습니다.

추가 파일:

- `scripts/verify_modal_qa.mjs`: 공통 동작·내부 기능·키보드·반복 개폐·리사이즈 실제 브라우저 검사.
- 이 보고서 및 `docs/verification/modal-qa/`의 JSON/스크린샷.
- 기존 여권/비자/국가 데이터/배지 검사 결과 JSON과 캡처는 이번 재실행으로 갱신.

공통 스타일 변경: **없음**. 기존 radius·안전 여백·스크롤 잠금·본문/헤더 구조를 유지합니다.

## 5. 실행 결과·증거

- `node scripts/verify_modal_qa.mjs`:165개 기록, FAIL0, 예외0.
- `node scripts/verify_passport_ui.mjs`:18회 통과.
- `node scripts/verify_visa_separation_ui.mjs`:18회 통과.
- `node scripts/verify_country_fixes_ui.mjs`:34회 통과.
- `node scripts/verify_baggage_labels_ui.mjs`: PC/모바일 공통 배지 통과.
- `npm.cmd run build`: TypeScript·Vite 빌드 PASS(1699모듈). 배포하지 않음.

[전체 모달 결과](docs/verification/modal-qa/results.json), [여권](docs/verification/passport/ui-results.json), [비자](docs/verification/visa-separation/results.json), [지원 도시](docs/verification/country-data-fixes/ui-results.json), [배지 색상](docs/verification/baggage-labels/badge-colors.json).

대표 PC/태블릿/모바일 캡처는 `docs/verification/modal-qa/`에 보존했습니다. [360px 허용량 폼](docs/verification/modal-qa/allowance-360.png), [390px 리사이즈 후 전압 모달](docs/verification/modal-qa/electricity-resize-390.png)을 직접 열어 헤더/닫기·본문/하단·모서리를 확인했습니다. 모든 이미지의 모든 스크롤 위치를 전수 육안 검사했다는 뜻은 아닙니다.

## 6. NOT TESTED / 한계

- 실제 iOS Safari/Android 기기, Safari overscroll·주소창·OS 키보드·실제 safe-area 장치: NOT TESTED. Chrome viewport에서 낮은 높이·가로 모드를 검사한 결과입니다.
- 스크린리더 음성·전체 WCAG 인증·색상 대비 전수 측정·모든 기능의 완전한 키보드 전용 여정: NOT TESTED. Tab/ShiftTab/Escape는 실제 키 이벤트로 실행했습니다.
- 모든 개별 항공권·정부 승인 상태·공식 규정 최신 원문: NOT TESTED. 서비스에서 승인 조회나 단정 기능을 추가하지 않음.
- 모든 국가·월·여행 목적의 조합과 미제출 폼 초안의 전체 조합: NOT TESTED.
- 이번 주 모달 검사는 reduced-motion 설정을 사용했습니다. 모든 열림/닫힘 모션 프레임의 성능·시각 효과 전수 검사는 NOT TESTED.
- Production 재배포/검증: NOT TESTED. 현재 로컬 결과를 공개 사이트 수정 완료로 보고하지 않습니다.
