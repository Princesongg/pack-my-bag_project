# PACK MY BAG 스타일 가이드

## 반응형 레이아웃 필수 원칙

- Desktop → Tablet → Mobile은 동일한 DOM과 공통 레이아웃을 사용한다. 기기별 페이지나 별도 디자인을 추가하지 않는다.
- 카드 열 수는 `auto-fit`, `minmax(min(100%, 최소 가독 너비), 1fr)`로 가용 너비에 맞춘다. 간격·패딩·타이포그래피에는 기존 토큰과 `clamp()`를 사용한다.
- breakpoint는 기기 이름이 아니라 실제 콘텐츠가 좁아지는 지점으로 정한다. 국가·도시 버튼의 2열은 유지하고, 날짜 입력은 충분한 너비에서2열·좁으면1열로 전환한다.
- 긴 본문과 카드에는 고정 높이를 두지 않는다. 날짜 입력54px·버튼 터치 영역44px처럼 조작 목적이 있는 크기와 불필요한 빈 공간을 만드는 높이를 구분한다.
- 수치와 설명의 글자 스타일을 분리하고, `min-width:0`과 자연스러운 줄바꿈을 사용한다. 잘림을 overflow로 감추지 않는다.
- 필수 검증 너비는1440/1280/1024/768/430/390/375/360px이다. 이 숫자를 그대로 breakpoint로 사용하지 않으며 중간 너비와 전환 경계도 확인한다.
- 기존 기능·국가 데이터·저장 상태·브랜드 색상과 일러스트 형태는 유지한다.

2026-10-25 정리. 기존 아이보리·블루·버터 옐로, 여행가방 일러스트, 화면 배치와 콘텐츠 구조를 유지한다. 이 문서는 현재 공통 스타일의 기준이다.

## 스타일의 단일 기준

1. `src/styles/tokens.css`: 색상·서체·크기·간격·모서리·입력창·아이콘 토큰.
2. `src/styles/ui.css`: 기존 버튼·폼·포커스·아이콘의 공유 기본 스타일.
3. 기존 화면별 CSS: 레이아웃·배치·반응형·애니메이션. 공통 값은 토큰으로 참조한다.
4. `StatusBadge.tsx` / `.css`: 상태 variant 렌더링과 배지 외형. 화면별 배경·글자·테두리 덮어쓰기를 만들지 않는다.

`main.tsx`에서 토큰 → 기본 UI → 전역/화면 CSS 순서로 로드한다. 기존 `--pmb-blue`, `--pmb-ink`, `--pmb-muted`와 항공 배지 변수는 토큰 별칭으로 유지한다. 개별 화면에 같은 HEX를 다시 선언하지 않는다.

## 조사에서 발견한 불일치

- 기존 CSS 32개에서 literal 색상 366종과 font-size 값 56종을 발견했다. 장식 일러스트 색상·초소형 모형 티켓 글자도 포함한 수치다.
- 서비스 블루 `#245BE0`, 프로젝트 소개 블루 `#2F6599` 등 역할이 같은 색이 달랐다.
- 카드 블루 `#EDF3FC / #EDF4FC / #F0F5FC`, 옐로 `#F6EDCF / #FAF1D8 / #F7EFD4` 등이 중복되었다.
- 보조 텍스트는 `#65738A / #65768F / #6A707A` 등으로 나뉘었다.
- 입력·버튼 radius 8/9/10px, 카드 12/14/15px 및 760/768px 모바일 기준이 혼재했다.
- 모바일 주요 문단에 12~13px가 섞여 있었고, 전압 준비물 배지는 항공 배지와 별도 CSS를 사용했다.
- 서비스 최상위 `overflow:hidden`이 실제 가로 넘침을 가릴 수 있었다. 이를 제거한 상태로 최종 화면을 검사했다.

공통 UI를 역할 기준으로 정리했다. 남아 있는 다양한 색상은 여행가방·여권·티켓·비행기 등 그림의 안료와 개별 콘텐츠 장식이다. UI 색상 수를 줄이려고 그림을 단색화하지 않는다. 미사용 레거시 `src/styles.css`도 호환 토큰으로 정리했지만 실제 진입점은 `main.tsx`다.

## 브랜드 컬러

아래 이름은 `--pmb-color-` 접두사로 사용한다.

| 역할 | HEX | 용도 |
|---|---|---|
| primary | `#245BE0` | 주요 행동·선택 상태·링크 |
| primary-hover | `#194BC4` | 주요 버튼 hover |
| primary-active | `#1743AD` | 주요 버튼 눌림 |
| background | `#FCFAF4` | 따뜻한 아이보리 화면 |
| surface | `#FFFDF7` | 기본 카드·입력·보조 버튼 |
| surface-blue | `#EDF3FC` | SMART TRIP BRIEF·기후·호환 정보 |
| surface-yellow | `#F7EFD4` | 준비물·확인 영역 |
| text-primary | `#202D42` | 본문·제목 |
| text-secondary | `#65738A` | 보조 설명·메타데이터 |
| border-default | `#D9E2EE` | 카드·구분선 |
| border-accent | `#CBD9EE` | 입력·보조 컨트롤 |
| on-primary | `#FFFFFF` | 블루 위 글자 |
| focus | `#C06B3E` | 키보드 포커스 |

## 상태 배지

| 의미 / variant | 배경 | 글자 | 테두리 |
|---|---|---|---|
| info / allowed / carry-on | `#E1EBFC` | `#244F8C` | `#BDD0EE` |
| warning / check-required | `#F7EFD4` | `#69512A` | `#E8DBA9` |
| danger / prohibited / checked-banned | `#F5DACC` | `#89553F` | `#E5B79F` |
| success / completed | `#EDF4EE` | `#35634D` | `#A9C7B4` |
| neutral | `#F0F1F3` | `#65738A` | `#D9E2EE` |

`--pmb-state-{상태}-{bg|text|border}` 세트를 사용한다. 같은 의미의 별칭은 같은 세트에 연결된다. `기내만 가능`은 carry-on, `위탁 금지`는 checked-banned, `확인 후 결정`·`제품 사양 확인 필요`는 check-required다. 상태 텍스트는 항상 표시한다. 색상만으로 허용·금지를 전달하지 않는다.

입력 오류·여권 기준 미달은 운송 금지 배지와 구분되는 error 역할이다. 기존 빨간 경고의 배경 `#FFF0EC`, 글자 `#982F27`, 테두리 `#D45C4E`를 유지한다. 기본 날짜 조건 충족은 입국 허가를 뜻하지 않는다.

```tsx
<StatusBadge label="기내만 가능" variant="carry-on" />
<StatusBadge label="위탁 금지" variant="checked-banned" />
<StatusBadge label="확인 후 결정" variant="check-required" />
```

variant를 생략해도 기존 항공 상태와 확인 상태의 한국어 라벨은 공통 컴포넌트가 분류한다. 새로운 의미는 명시적인 variant를 사용한다. 배지는 13px·Bold, 4×8px padding, 1px border, 8px radius다. 아이콘·색상을 추가해도 라벨을 없애지 않는다.

## 타이포그래피

폰트 스택은 기존 Pretendard → 시스템 폰트 → Apple SD Gothic Neo → Noto Sans KR → Segoe UI → sans-serif를 유지한다. 폰트 파일이나 외부 폰트 API를 추가하지 않았다. 실제 사용 폰트는 설치 환경에 따라 달라지며 검증 Chrome에서는 한글 제목에 로컬 **Noto Sans KR**이 사용되었다. 영문 브랜드 헤드라인의 Arial Black 계열은 유지한다.

| 역할 | 기준 |
|---|---|
| Display / Hero | 기존 화면별 큰 영문 헤드라인과 clamp 유지, 900 weight |
| Page Title | 32~52px 반응형 기준; 브랜드 성격의 Ready to pack / LAST CALL은 Display 취급 |
| Section Title | 24px 중심; 작은 섹션 20px |
| Card Title | 18px; 조밀한 정보 카드 16px |
| Body | PC 16px / 모바일 주요 본문 14px, line-height 1.7 |
| Small Text | 14px |
| Caption | 13px, 출처·메타데이터·배지 |
| Data Value | 24px compact / 32px 기본 / 모바일 28px |
| 날씨 요약 기온 | PC 34px / 모바일 30px |
| Modal Header | PC 20px / 모바일 18px |

브랜드 히어로·진행률·시각은 기존 강조 크기를 유지한다. 큰 수치는 `tabular-nums`와 숫자용 클래스를 사용한다. `공식 정보 확인 필요` 같은 문구에 숫자 클래스를 적용하지 않는다. 기후 카드의 결측 지표는 숨기고 짧은 보조 안내를 표시하는 기존 동적 레이아웃을 유지한다.

한글 본문은 `word-break:keep-all`, `overflow-wrap:break-word`로 처리한다. 긴 URL·식별자 등은 필요한 영역에서만 anywhere를 쓴다. 장식 그림 안의 모형 여권·티켓 텍스트는 실제 안내 본문이 아니므로 기존 크기를 보존한다.

## 간격·모서리·컨트롤

- spacing: 4px 단위. `--pmb-space-1`=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px … 16=64px.
- 일반 카드 padding: 16~24px. 조밀한 모바일 카드 12~16px. 카드 내부 gap 8/12/16px.
- 섹션 간격: 24/32px 중심. 히어로의 넓은 공간은 기존 구성을 유지한다.
- radius: small 8px(버튼·입력·배지), card 12px, panel 16px, modal 20px. 원·pill은 별도 형태다.
- 입력창 48px, 작은 버튼·아이콘 행동의 터치 영역 최소 44px. 주요 CTA는 기존 큰 56~60px 크기를 유지하는 large variant다.
- 1px 테두리·2px 포커스·SVG 선은 spacing scale과 별개다. 일러스트 좌표·회전·그림 비율을 4px 단위로 반올림하지 않는다.

## 기존 공통 구조와 사용 규칙

새 레이아웃 래퍼를 여러 개 복제하지 않고 기존 컴포넌트를 재사용한다.

| 역할 | 실제 구현 / 공통 스타일 |
|---|---|
| Button | 기존 `pmb-cta`, primary/secondary/ghost 클래스와 `ui.css` 기본 규칙. 목적별 크기는 유지하고 색상·radius·포커스는 토큰 참조 |
| StatusBadge | `travel-info/StatusBadge.tsx` / `.css` |
| InfoCard / ModalSection | 기존 `pmb-guide-info-card`, weather/season/packing section, 공유 배경·padding·border·radius 토큰 |
| SummaryCard | `my-bag/TripBrief.tsx` / `.css`; grid + flex-column + `margin-top:auto` 하단 링크 |
| ModalHeader | `my-bag/ServiceModal.tsx` / `TripBriefModal.css`; 모든 모달에서 재사용 |
| DataMetricCard | `travel-info/ClimateMetrics.tsx`; 유효한 수치만 숫자 스타일 적용 |
| SourceList | `travel-info/SourceLinks.tsx`; 전자기기 상세도 같은 컴포넌트 사용 |
| ChecklistItem | 기존 MY BAG·LAST MINUTE 목록; 공유 터치 높이·checkbox·간격·완료 색상 토큰 |
| FormInput | 기존 label/input/select 구조; `ui.css` 및 각 폼의 토큰 기반 스타일. 폼 로직·ID 유지 |

전압 준비물의 별도 배지 색상 정의는 제거했다. 항공·준비물 모두 StatusBadge를 사용한다. 요약 카드의 하단 링크를 맞추기 위해 카드별 임의 margin을 더하지 않는다. 요약 설명의 line-clamp로 문구를 잘라 숨기지 않는다.

## 모달·출처

- 기본 최대 너비 720px, PC 최대 높이 `100dvh - 64px`.
- 모바일 768px 이하: 기존 하단 sheet 형태, 최대 높이 92dvh, 위쪽 radius 20px 유지.
- 헤더 padding PC 16×24px / 모바일 12×16px. 닫기 버튼은 동일한 ServiceModal 구조와 44px 이상 터치 영역.
- 본문 padding PC 20×24px / 모바일 16px 중심, safe-area 유지.
- 본문은 모달 내부에서 세로 스크롤한다. 기존 배경 스크롤 잠금·닫은 후 포커스 복귀·Escape·Tab 이동은 변경하지 않는다.
- 공식 링크·확인일은 SourceLinks로 제공하며 텍스트와 날짜를 삭제하지 않는다. 긴 자료·예외는 기존 details 구조를 유지한다.
- 날씨의 수치, 전압의 준비물, 항공 규정의 예외는 정보 목적에 맞는 구조를 유지한다.

## 아이콘·플러그 그림

- 보조 아이콘 16px, 행동 20px, 제목 24px. 제목/행동 Lucide stroke 1.75.
- 장식용 비행기·여행가방·큰 날씨 아이콘은 기존 크기·모양을 유지한다.
- 콘센트 그림 compact PC 110px / 모바일 88px, 상세 최대 112px. SVG 자체 width 100%와 기존 viewBox를 유지하므로 빈 박스만 커지지 않는다.
- 여러 플러그는 flex-wrap 또는 minmax(0,1fr) grid로 배치한다. 핀 모양·순서·국가별 타입 데이터는 변경하지 않는다.

## 반응형

- 기본 모바일 기준: **768px 이하**. 기존 760px 기준을 통합했다.
- 태블릿 주요 범위: 769~1100px. 900px·680px·480px 등의 기존 콘텐츠별 축소 지점은 그림·복잡한 구성의 예외로 유지한다.
- 테스트 폭: 1440 / 900 / 768 / 390 / 320px.
- grid에는 `minmax(0,1fr)`, 줄어들 수 있는 자식에는 `min-width:0`을 유지한다. 모바일 summary 카드는 기존 1열 구조를 유지한다.
- 페이지 전체를 overflow:hidden으로 가려 문제를 숨기지 않는다. 모달 세로 스크롤, 접이식 애니메이션의 clip, 그림 프레임 등 의도된 영역만 예외다.
- 줄바꿈·grid·flex를 먼저 고친다. 수치 단위는 작은 화면에서 자연스럽게 줄바꿈할 수 있다.

## 실제 수정 범위

- 추가: `src/styles/tokens.css`, `src/styles/ui.css`, 이 문서.
- 진입점: `src/main.tsx`.
- 기존 CSS 32개: global/archive/responsive, home/planning, service/typography, workspace/destination/trip, travel-info, my-bag/RED FLAGS/PACK LESS/LAST MINUTE/완료 스타일의 토큰 참조 및 가독성 정리. 상세 파일 목록은 style-audit-before.json의 files에 있다.
- React 재사용 정리: `StatusBadge.tsx`, `ElectricityInfo.tsx`, `ElectronicsGuidance.tsx`.
- 검증 도구: `scripts/audit_styles.mjs`, `normalize_design_tokens.mjs`, `verify_design_system_ui.mjs`, 기존 배지 검증 스크립트.
- 국가 데이터·공식 출처·저장 모델·화면 라우트·추천 규칙·완료 애니메이션 로직은 수정하지 않았다.

## 검증 결과와 전후 차이

- 전: 유사 배경·radius·보조 글자 크기·배지 CSS가 화면마다 중복. 후: 의미별 색상·4px 간격·8/12/16/20px radius와 공통 배지/입력 토큰 사용.
- 전: 모바일 일부 주요 본문 12~13px. 후: 주요 설명·폼은 14px 이상, 출처·상태·보조 메타데이터는 13px 기준.
- 기존 카드 위치·그림·도시 데이터·팝업 내용 구조 유지. 준비물의 `확인 후 결정`은 옐로, 항공 `위탁 금지`는 피치로 역할 구분.
- `node --test tests/*.test.mjs`: 기존 82개 기능 테스트 통과.
- `npm.cmd run build`: TypeScript 및 Vite 빌드 통과.
- 전체 흐름 14개 화면 × 5개 폭 = **70개 화면 검증**. 가로 넘침·모달 넘침·기후 숫자 넘침 없음, 버튼 터치 영역 확인. 시작/기획/입력/MY BAG/날씨/전압/항공/전자기기/RED FLAGS/PACK LESS/확인 모달/LAST MINUTE/완료 포함.
- 체크 후 새로고침 보존, 마지막 점검 진입, 완료 화면 전환, 키보드 포커스 이동 동작 유지. 일반 motion의 비행기 takeoff → complete와 reduced-motion 완료 경로도 확인.
- 배지의 PC·모바일 background/color/border 계산값 일치 검증 통과.
- 데이터 전체 SHA-256 비교: 변경 0개. 런타임 외부 요청·새 API·서버·유료 라이브러리 추가 없음.
- 전후 스크린샷·실제 폰트·검증 JSON: `docs/verification/design-system/`.

```powershell
node scripts/audit_styles.mjs after
node --test tests/*.test.mjs
npm.cmd run build
$env:DESIGN_PHASE='after'
$env:DESIGN_WIDTHS='390'
node scripts/verify_design_system_ui.mjs
```

`normalize_design_tokens.mjs`는 이번 정리를 기록한 오프라인 CSS 마이그레이션 도구다. 서비스 실행 시 호출하지 않으며, 새 스타일은 처음부터 토큰을 사용한다. 실물 Safari/Android 기기 검증을 대신한다고 주장하지 않는다. 반응형 검증은 설치된 Chrome의 viewport 에뮬레이션에서 수행했다.
