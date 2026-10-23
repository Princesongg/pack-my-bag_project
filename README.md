# PACK MY BAG — Project Shell

여행 준비 서비스의 **프로젝트 기획 카드 / 프로젝트 구현 카드**가 있는 바깥틀 웹사이트입니다.

## 포함된 페이지
- `/` — 메인 페이지: 기획 및 구현 카드
- `/planning` — 기획 페이지 틀 (Figma 기획 보드 링크 포함)
- `/implementation` — 실제 PACK MY BAG 서비스 HOME
- `/implementation/destination` — STEP 01 국가·도시 선택 (선택값은 localStorage에 저장)
- `/implementation/trip-details` — STEP 02 여행 일정·여행 스타일·수하물 설정

## 실행
```bash
npm install
npm run dev
```

## 빌드
```bash
npm run build
```

Vercel 배포 시 `vercel.json`의 SPA rewrite 설정이 경로 새로고침을 처리합니다.

## 코드 구조
- `src/App.tsx`: 기존 URL 라우팅 관리
- `src/pages/home/`: `Home.tsx`, `Home.css`, `HeroVisual.tsx`, `ProjectCard.tsx` — 아카이브 메인 및 페이지 전용 컴포넌트
- `src/pages/planning/`: `Planning.tsx`, `Planning.css`, `topics.ts` — 기획 CASE STUDY 및 기획 카드 목록
- `src/components/archive/`: `ArchiveLayout.tsx`, `ArchiveHeader.tsx`, `ArchiveFooter.tsx` — Home과 Planning이 공유하는 아카이브 레이아웃
- `src/service/`: 기존 `ServiceHome.tsx`, `service.css` 유지 — 실제 여행 서비스와 전용 헤더·내비게이션 관리
- `src/styles/global.css`: 기본 글꼴·리셋·앱 레이아웃
- `src/styles/archive.css`: 아카이브 공통 스타일
- `src/styles/responsive.css`: 기존 아카이브 반응형·모션 감소 규칙. 기존 우선순위를 유지하도록 페이지 스타일 다음에 불러옵니다.

서비스 스타일은 기존 `.pmb-service` 범위를 유지합니다. 국가별 데이터와 이미지가 필요해지면 `data`와 `assets` 폴더를 추가합니다.

## 여행지 선택
- `src/service/ServiceHeader.tsx`: 서비스 공통 내비게이션
- `src/service/destination/Destination.tsx`, `Destination.css`: 국가·도시 카드 선택 화면
- `src/service/destination/destinations.ts`: 지원 여행지 목록과 선택값 검증·저장 로직
- 통합 localStorage 키: `pack-my-bag.trip.v1`. 기존 `pack-my-bag.destination.v1`의 선택값은 최초 복원 시 가져옵니다.
- 국가 변경 시 도시는 초기화됩니다. 저장 공간 사용이 제한되면 화면 내 선택은 유지하고 안내를 표시합니다.
- 국가와 도시 선택 후 NEXT 버튼으로 TRIP DETAILS에 진입합니다. 여행지를 선택하지 않고 직접 진입하면 여행지 선택 화면으로 돌아갑니다.

## 여행 일정 및 스타일
- `src/service/trip/TripContext.tsx`: 여행지와 일정·스타일·수하물을 하나의 React Context 상태로 관리하고 변경 시 저장합니다. 저장 실패 시 화면 내 이동은 유지하고 안내합니다.
- `trip.ts`: 여행 목적·수하물 옵션, 날짜 검증, 기간 계산, 저장값 복원·마이그레이션 로직입니다.
- 저장 필드: `countryId`, `cityId`, `departureDate`, `returnDate`, `tripDays`, `tripNights`, `travelPurpose`, `baggageType`.
- `TripDetails.tsx`, `TripDetails.css`: TRIP DETAILS 화면과 전용 반응형 스타일입니다.
- `TripProgress.tsx`, `TripProgress.css`: 입력 과정의 DESTINATION / TRIP DETAILS 진행 표시입니다.
- 날짜는 `YYYY-MM-DD` 형식으로 저장하고 UTC 날짜 일수 차이로 계산합니다. 오늘은 사용자의 로컬 날짜를 기준으로 하며 과거 날짜·역순 날짜는 완료할 수 없습니다. 저장된 기간은 복원 시 재계산합니다.
- NEXT는 필수 항목 완료 시 저장 상태와 입력 완료 안내만 표시합니다. TRAVEL INFO·추천·체크리스트·AI API는 아직 구현하지 않습니다.

선택 상태 및 저장 로직 테스트: `node --test tests/destination.test.mjs`

전체 선택·일정 로직 테스트: `node --test tests/*.test.mjs`

현재는 **AI API 연동 여부가 보류**이며, 이 코드에는 AI API가 없습니다.

디자인은 참조 사이트의 정보 구조만 활용하고 색상·타이포·일러스트를 독립적으로 구성했습니다.
