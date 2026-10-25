# 태국 플러그 형태 재검증

실제 확인일: 2026-10-25

## 판단과 적용

관광청 전기 안내는 220V·50Hz, 납작한 핀·둥근 2핀 및 일부 3핀 시설을 설명한다. TAT Newsroom은 C/F 호환을 설명하지만 이것만으로 태국의 대표 형태를 C/F 두 종류로 제한하기는 어렵다.

QSNCC 공식 HTML의 electricityDescription/전기 설명에서 C/O 주요 형태, A/B 병존 및 행사장 자체의 Type O 사용을 확인했다. 태국 정부가 관리하는 2026 Annual Meetings 안내는 Type O를 둥근 3핀 표준으로 설명하며 A/B/F의 복합 콘센트 호환도 안내한다.

이에 요약·기본 그림은 **Type C / O**, 추가 형태는 **A/B/F**로 분리했다. 행사장의 설치 형태를 모든 숙소의 보장으로 확대하지 않는다. 한국 접지형 플러그의 물리적 맞음새와 실제 접지 연결은 별도 확인하도록 유지했다. 제품의 INPUT 전압·50Hz 대응, 허용 전력·어댑터 안내 및 220V·50Hz 값은 유지한다.

## Type O 도식

정부 행사 안내의 Type O 참고 이미지 https://www.am2026thailand.go.th/images/plug-type-o.jpg 를 시각적으로 확인했다. 둥근 전원 핀 2개와 둥근 접지 핀 1개를 삼각형으로 표현한다. 참고 그림과 같은 방향으로 두 전원 핀은 아래 좌우, 접지는 위쪽 중앙이다.

기존 로컬 SVG 컴포넌트의 Type O 분기만 추가했다. 콘센트·플러그 정면 모두 둥근 접점 3개이며, Type B의 납작한 전원 핀이나 Type F의 접지 클립으로 그리지 않았다. 정면 식별용 도식이므로 핀 길이·제품 치수를 보장하는 설계 도면은 아니다. 공식 이미지를 런타임에 불러오지 않는다.

## 수정 파일

- `src/service/data/electricity.ts`: TH 주 타입 C/O, 추가 형태 A/B/F, Type O 정의와 공식 근거 연결.
- `src/service/data/plugVisuals.ts`: TH 그림 C/O, O의 한글 명칭·접지 정보.
- `src/service/data/electricityGuide.ts`: TH 대표 형태와 시설별 호환 설명; 기존 한국 제품·준비물 안내 유지.
- `src/service/data/sources.ts`: QSNCC·정부 행사 공식 출처 추가. 기존 관광청 C/F 자료는 호환 설명의 근거로 구분.
- `src/service/travel-info/PlugVisuals.tsx`: O의 3개 둥근 핀/구멍 SVG. 기존 타입 분기는 유지.
- `src/service/data/raw/th-electricity/`: 직접 확인한 공식 HTML 2개 보존.
- 테스트: `tests/electricity-guide.test.mjs`, `scripts/verify_th_plugs_ui.mjs`.

전기·기후 숫자, 다른 국가 타입·SVG, 추천 상태·체크리스트 저장, 항공 반입 및 공통 스타일은 변경하지 않았다.

## 검증

- 자동 테스트 83개 통과. TH 220V·50Hz, C/O 및 추가 A/B/F 근거, 시설별 접지 안내, 다른 5개국의 기존 타입 유지 포함.
- TypeScript 및 Vite 빌드 통과.
- 방콕·푸껫·치앙마이 × 1440/390/320px = 9개 실제 여행 생성/모달 시나리오 통과.
- C/O 순서·한글 라벨·중앙 그림 크기(PC 110px / 모바일 88px), 원형 접점 3개와 삼각 배치, 모달 가로 넘침 없음 확인.
- 어댑터 중복 없음, 체크 새로고침 유지·제외/복원, 항공안전 모달 유지 확인.
- TH 팝업에 QSNCC·정부 행사 출처 표시. 일본·대만·베트남·호주 자료 혼입 없음. 한국 비교 기준은 기존 별도 영역으로 유지.
- 브라우저 예외·외부 런타임 요청 없음. 화면과 검증 결과: `docs/verification/th-plugs/`.

## 공식 출처

- 태국관광청: https://www.tourismthailand.org/Articles/plan-your-trip-electricity
- TAT Newsroom: https://www.tatnews.org/visitor-information/
- QSNCC: https://www.qsncc.com/en/visit/plan-your-trip/
- 태국 정부 2026 행사: https://www.am2026thailand.go.th/electrical-info-and-devices

새 API·유료 서비스·외부 이미지 연동은 없다.
