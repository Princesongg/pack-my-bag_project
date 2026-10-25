# 6개국 공통 전압 안내 적용 결과

작업일: 2026-10-25

전압 팝업을 단일 ElectricityInfo로 통합했다. 국가별 답변과 준비물 상태는 getElectricityGuide, 실제 전기 수치는 기존 electricity / international 원본에서 읽는다. 기존 베트남 전용 상세 섹션 데이터는 제거해 팝업·MY BAG의 추천 문구가 각각 따로 바뀌는 구조를 없앴다.

## 국가별 결과

| 국가 | 수치 | 우선 표시 그림 | 어댑터 상태 |
| --- | --- | --- | --- |
| 일본 | 100V · 50 / 60Hz | 납작한 2핀 · A | 준비 권장 |
| 베트남 | 220V · 50Hz | 둥근 2핀 C / 납작한 2핀 A | 준비 권장 |
| 태국 | 220V · 50Hz | 둥근 2핀 C / 접지형 F | 확인 후 결정 |
| 대만 | 110V · 60Hz | 납작한 2핀 A / 접지 3핀 B | 준비 권장 |
| 미국 | 110–120V · 60Hz | 납작한 2핀 A / 접지 3핀 B | 준비 권장 |
| 호주 | 220–240V · 50Hz | V자형 I · 접지 3핀, 큰 비교에서 2핀도 표시 | 준비 권장 |

태국은 기존 전기 자료가 미수집 상태였으므로 공식 TAT 자료를 확인해 국가 데이터에 연결했다. [태국관광청 Electricity](https://www.tourismthailand.org/Articles/plan-your-trip-electricity)에서 220V·50Hz, 납작 2핀·둥근 2핀, 일부 3핀 시설과 기기·접지 주의를 확인했다. [TAT Visitor Information](https://www.tatnews.org/visitor-information/)은 C/F를 안내하며, [Panasonic 태국 행](https://panasonic.jp/tourist/en/electricity.html)은 A/B/C/F를 제시한다. 표시 순서를 사용 빈도 순위로 주장하지 않는다. 신규 태국 출처와 [한국 비교 기준](https://panasonic.jp/tourist/en/electricity.html)만 실제 확인일 2026-10-25로 추가했으며 다른 기존 출처의 날짜는 일괄 변경하지 않았다.

## 공통 표시

모든 국가에 동일한 네 질문(한국 제품 사용 / 콘센트 모양 / 준비물 / 주의사항)을 같은 위치에 표시한다. 숫자와 한 줄 어댑터 행동을 먼저 보여주고, 접이식 영역에 큰 그림 비교·추가 형태·접지·고전력 예외를 둔다. 작은 콘센트 영역도 PC 110px / 모바일 88px로 유지했다. 한글 명칭을 Type 표기보다 먼저 읽게 했다. Type F는 원형 핀과 접지 접점을 그리며, 기존 핀 모양을 다른 타입으로 재사용하지 않는다.

준비물은 상태·한 줄 이유와 함께 동일한 노란 영역에 표시한다. 충전기는 입력 사양을 확인한 뒤 결정, 어댑터는 국가별 권장 또는 확인 후 결정이다. 제품 조건이 없는 변압기·드라이어·고데기를 자동 생성하지 않는다. ‘필수’는 현재 자동 사용하지 않는다.

## 체크리스트·기존 상태

기존 두 물품 ID를 재사용한다. 이미 추가한 사용자 어댑터가 있으면 새 기본 항목을 만들지 않고 기존 custom ID·체크 상태·제외 결정을 유지한다. 팝업과 체크리스트의 명칭·상태·이유는 같은 모델에서 온다. 저장 키·스키마 버전은 변경하지 않았다.

전기 공통화를 위해 수정한 주요 파일:

- `src/service/data/electricityGuide.ts`: 국가별 답변, 상태, 출처 검증, 공통 준비물 조회.
- `src/service/data/electricity.ts`, `plugVisuals.ts`, `sources.ts`: 태국 자료와 F형, 쉬운 한글 라벨, 한국 비교 출처.
- `src/service/travel-info/ElectricityInfo.tsx`, `ElectricityInfo.css`, `PlugVisuals.tsx`: 공통 UI·접이식 상세·준비물 상태.
- `src/service/my-bag/TripBrief.tsx`, `bag.ts`, `MyBag.tsx`: 단일 모델로 요약·준비물 연결.
- `src/service/data/notices.ts`: 기후 정보의 의미와 예보 확인 행동을 보완.
- `tests/electricity-guide.test.mjs`, 기존 전기 관련 테스트: 6개국·사용자 저장·출처 누락 회귀 검증.
- `scripts/verify_electricity_common_ui.mjs`: 실제 17개 도시 생성 흐름.

## 검증

PC 1440px·모바일 390px 각각 **6개국 17개 도시**, 총 **34개 실제 TRIP SETUP → MY BAG 생성 흐름 통과**.

- 일본 4개, 베트남 4개, 태국 3개, 대만 2개, 미국 2개, 호주 2개 도시.
- 수치·그림 유형·네 질문 순서·팝업 및 체크리스트 명칭/상태/이유 일치.
- 어댑터 체크 후 새로고침 복원. 각 국가 대표 도시에서 PACK LESS 제외·복원 및 기존 전자기기 항공 안내 3개 카드 확인.
- PC 카드 높이 일치, 페이지·모달 가로 넘침 없음, 충분한 SVG 크기 확인. PC·모바일 실제 캡처 시각 점검.
- 일본 외 국가의 전기 출처에 JNTO·japan.travel 링크가 없음. 한국 비교 자료는 별도 표기.
- 미확인/출처 없음/확인일 누락 상황에서 verified 판정과 자동 준비물 생성이 차단됨을 단위 테스트로 확인.
- 전체 테스트 **74개**, TypeScript 및 Vite 프로덕션 빌드 통과. 브라우저 예외·외부 요청 0건.

기후·통화·입국·항공 규정의 기존 데이터는 유지했다. 공통 기후 안내문 외에 다른 여행 정보 전체를 재작성하지 않았으며 [공통 작성 원칙과 영역별 점검](INFORMATION_UX_PRINCIPLES.md)에 실제 적용 범위를 기록했다. 유료/종량제 API, 외부 이미지 서비스, 신규 서버·DB는 추가하지 않았다.

[결과 JSON](verification/electricity-common/ui-results.json) · [일본 PC](verification/electricity-common/JP-1440.png) · [태국 PC](verification/electricity-common/TH-1440.png) · [대만 모바일](verification/electricity-common/TW-390.png) · [호주 모바일](verification/electricity-common/AU-390.png)
