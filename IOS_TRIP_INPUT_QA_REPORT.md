# iPhone TRIP INPUT 레이아웃 수정

검증일: 2026-10-27 (Asia/Seoul). **로컬 수정·Windows WebKit/Chrome 검증 완료. 실제 iPhone·iOS Safari 및 Production 수정 후 검증은 NOT TESTED입니다. 실제 기기 문제 해결 완료를 의미하지 않습니다.**

## 관측과 원인 구분

사용자가 제공한 실제 iPhone 화면에서 날짜 컨트롤이 오른쪽으로 넘치며 귀국일 라벨과 안내 문구를 침범하는 것을 확인했습니다. 상단 내비게이션과 상태 표시줄 겹침도 화면에 보입니다. Slack을 원인으로 취급하지 않았습니다.

### 헤더

배포 코드의 viewport는 `width=device-width, initial-scale=1.0`입니다. `viewport-fit=cover`, 확대 금지, negative top은 없으며 헤더·내비게이션은 고정/absolute/sticky가 아닌 일반 문서 흐름입니다. 따라서 fixed 헤더가 원인이라고 단정할 근거가 없습니다.

WebKit 공식 설명상 기본 viewport-fit:auto는 Safari가 안전 영역을 자동 처리합니다. 기존 설정 자체를 잘못됐다고 판단하거나 전역 cover를 추가하지 않았습니다. 다만 작업 화면에는 별도의 safe-area 방어가 없었고, 14px 입력 글꼴은 iOS의 입력 포커스 확대를 유발할 수 있는 조건입니다. **실제 상태 표시줄 겹침의 단일 원인은 미확정**입니다. 기기/iOS·Safari 버전, 브라우저 UI 축소·스크롤 상태·포커스 확대 상태를 같은 iPhone에서 확인해야 합니다.

### 날짜 입력과 겹침

- 배포 날짜 컨트롤은 `width:100%`, 내부 padding, iOS 기본 appearance를 사용했습니다. 이 조합의 iOS 전용 폭 계산 문제는 [WebKit 오류 301648](https://bugs.webkit.org/show_bug.cgi?id=301648)에 보고되어 있습니다. 이번 화면의 우측 넘침과 일치하는 위험 조건이지만 해당 버전의 iPhone에서 직접 재현/확정한 것은 아닙니다.
- 라벨이 `grid-template-rows:auto 54px`로 입력 행을 고정해, native 날짜 컨트롤의 실제 그려진 높이가 이를 초과하면 다음 라벨/설명 위에 겹칠 수 있는 구조였습니다. iOS에서 정확히 어떤 shadow control이 높이를 초과했는지는 NOT TESTED입니다.
- 모바일 date/search 입력 글꼴이 14px였습니다. iOS 포커스 자동 확대를 피하기 위해 16px 이상을 사용하는 접근은 [Flutter 공식 웹 접근성 문서](https://docs.flutter.dev/ui/accessibility/web-accessibility#viewport-zoom-and-mobile-text-inputs)에도 설명되어 있습니다.
- 날짜 안내 컨테이너의 `min-block-size:4.8em`은 짧은 문구에도 약 67.2px를 예약하고 있었습니다. 날짜와 여행 목적 사이의 불필요한 공백 원인으로 코드와 실제 좌표에서 확인했습니다.

Windows WebKit에서도 수정 전의 거대한 날짜 입력·상태 표시줄 겹침은 재현되지 않았습니다. 첨부 화면의 문제가 브라우저 에뮬레이션만으로 해소됐다고 보고하지 않습니다.

## 수정 범위

1. `src/service/trip/TripSetup.tsx`: 날짜 input을 별도 `.pmb-setup-date-control` 래퍼로 감쌌습니다. label 연결, input type=date, value/onChange/min/max/required 및 날짜 계산은 유지했습니다.
2. `src/service/trip/TripSetup.css`: ≤640px에서 라벨을 자연 높이의 세로 Flexbox로 바꾸고 날짜 1열을 사용합니다. border·padding은 래퍼로 옮기고 input의 padding은 0으로 두어 iOS의 `100%+padding` 조합을 피했습니다. min-width:0/box-sizing 및 native appearance를 정리했습니다. input은 기존 공통 control 토큰 48px, 래퍼 테두리 포함 50px입니다. 날짜 선택 기능은 native type=date 그대로이며 커스텀 달력을 만들지 않았습니다.
3. 같은 모바일 범위에서 date/search 글꼴을 16px로 유지해 포커스 자동 확대 위험을 줄였습니다. 확대를 금지하는 viewport 옵션은 추가하지 않았습니다. 날짜 안내의 최소 높이를 해제하여 실제 내용만큼만 흐르게 했습니다.
4. `src/service/workspace/Workspace.css`: ≤640px의 TRIP INPUT 작업 화면에만 env(safe-area-inset-top/right/bottom/left,0px) 패딩과 text-size-adjust:100%를 적용했습니다. 브라우저가 inset을 제공하면 이를 사용하고 0이면 임의 상단 여백을 만들지 않습니다. 전역 viewport나 다른 화면의 헤더 구조는 변경하지 않았습니다.
5. `scripts/verify_ios_trip_input.mjs`: Windows WebKit/Chrome 두 엔진의 전후 좌표·스크린샷·폼 기능 검사 추가. Playwright와 WebKit 바이너리는 프로젝트 의존성 대신 `node_modules/.cache/ios-browser-tools`에 별도 설치했습니다. package.json/lock 및 Git/Vercel 설정은 변경하지 않았습니다.

safe-area 근거: [WebKit 공식 iPhone 안전 영역 안내](https://webkit.org/blog/7929/designing-websites-for-iphone-x/). 현재 일반 Safari의 자동 안전 영역 처리는 유지하며, env 패딩이 상태 표시줄 겹침을 실제로 해결했는지는 iPhone에서 확인해야 합니다.

## 실행 결과

| 항목 | 상태 | 실제 범위 |
|---|---|---|
| 공개 사이트 확인 | PASS | 공개 URL HTTP200 및 현재 배포 viewport·JS/CSS 읽기. 수정 배포 완료 판정 아님 |
| Windows WebKit | PASS | 1440/1280/1024/820/768/430/390/375/360/320px, 빈 폼·날짜 입력·국가/도시·목적/수하물 선택·제출·MY BAG reload 복원 |
| Windows Chrome | PASS | 같은 10개 너비와 기능 흐름. 20개 엔진/너비 조합 전체 |
| 날짜·라벨·안내 겹침/가로 넘침 | PASS | 위 두 데스크톱 엔진에서 좌표 assertion 및 캡처. iOS PASS 아님 |
| PC/태블릿 유지 | PASS | ≥768px 날짜 높이 54px·폭 전후 동일, WebKit에서 폼 전체 높이도 동일 |
| 모바일 입력 크기 | PASS | 두 날짜 입력 모두 48px, 글꼴16px, 컨트롤 래퍼 약50px |
| 모바일 여백 | PASS | 선택 후 안내영역 약67.2→44.8px, 날짜 입력 축소와 합쳐 폼 높이 약30.4px 감소 (WebKit 390/320px 기준) |
| 버튼 접근 | PASS | 국가/도시·목적·수하물은 force 없는 화면 클릭, 제출 버튼 scrollIntoView 및 중앙 hit-test, MAKE MY BAG 클릭 성공 |
| 날짜 계산 | PASS | 2026-11-09~2026-11-17 → 8박9일, 단위 테스트도 유지 |
| 단위 테스트 | PASS | trip/destination/my-bag 17개 |
| 최종 빌드 | PASS | TypeScript/Vite npm.cmd run build |
| 실제 iPhone/iOS Safari | NOT TESTED | Windows 환경이며 연결된 iPhone·Xcode Simulator 없음 |
| iOS native 날짜 선택창·키보드·포커스 확대 | NOT TESTED | 날짜 type은 유지했지만 자동 fill은 기기의 실제 날짜 선택 UI를 검증하지 못함 |
| 상태 표시줄 실제 안전 영역·Safari 주소줄 축소/복귀 | NOT TESTED | 데스크톱 WebKit은 iPhone 하드웨어/브라우저 UI를 재현하지 못함 |
| nonzero inset 합성 검사 | NOT TESTED | 설치된 Chrome은 Emulation.setSafeAreaInsets 명령을 지원하지 않아 시도 중단 |
| 가로모드·큰 글자/페이지 확대 설정·전체 국가/도시 조합 | NOT TESTED | 이번 검사는 요청된 세로 화면 너비·일본 오사카 기준 |
| Vercel 재배포 후 실제 Production | NOT TESTED | 이번 수정은 로컬에만 적용, 배포/커밋/푸시 실행하지 않음 |

전후 근거: [수정 전 결과](docs/verification/ios-trip-input/before/results.json), [수정 후 결과](docs/verification/ios-trip-input/after/results.json), [배포 CSS 기준](docs/verification/ios-trip-input/production-baseline.json). 수정 후 모든 조합의 console.error·JS 예외 및 취소 제외 리소스 실패가 0인지 검사합니다.

캡처: [WebKit 390 날짜 선택 후](docs/verification/ios-trip-input/after/webkit-390-dates.png), [WebKit 320 전체 빈 폼](docs/verification/ios-trip-input/after/webkit-320-empty.png). 표시된 날짜 문자열의 구분자는 OS/엔진 locale에 따라 달라질 수 있습니다.

## 동일 iPhone에서 재배포 후 확인

1. 기존 GitHub→Vercel 방식으로 수정 코드를 배포하고 Production이 새 커밋/자산을 제공하는지 확인합니다. 기존 localStorage를 삭제하지 않고 같은 사이트를 다시 로드합니다.
2. Safari에서 상단까지 스크롤한 상태, 아래로 내려 주소줄이 축소된 상태, 다시 위로 돌아온 상태에서 TRIP INPUT/MY BAG과 시계·통신·배터리 영역이 겹치지 않는지 확인합니다. 홈 화면 웹앱을 사용했다면 일반 Safari와 각각 확인합니다.
3. 국가·도시 검색을 눌렀다 닫고, 출발/귀국 날짜를 iOS 날짜 선택창에서 실제 선택합니다. 예상치 못한 자동 확대, 컨트롤 높이 증가, 오른쪽 넘침, 라벨/안내 침범을 확인합니다.
4. 11월9일~17일이 8박9일로 표시되는지, 목적·수하물 선택 후 하단 MAKE MY BAG 버튼이 끝까지 스크롤되고 터치되는지, 생성·새로고침 후 여행이 복원되는지 확인합니다.
5. 계속 겹치면 iPhone 기종·iOS 버전·Safari/Chrome/홈화면 실행 여부·페이지 확대율과 재현 시점을 함께 기록합니다. 데스크톱 검사 통과를 근거로 실제 기기 문제를 종료하지 않습니다.

이전 실행은 사용량 한도로 자동 승인 검토가 완료되지 않아 검증이 중단됐습니다. 2026-10-27 재개 후 허용된 실행에서 위 빌드·브라우저 검사를 수행했습니다. 제한을 우회한 실행은 하지 않았습니다.
