# 베트남 전압·콘센트 최종 적용

실제 자료 확인일: **2026-10-25**

하노이·다낭·나트랑·푸꾸옥 전체가 국가 공통 `electricity.VN`을 읽는다. 도시별 전기 데이터는 만들지 않았으며 다른 국가의 수치와 안내 구조는 바꾸지 않았다.

## 적용 내용

- 공통 요약: **220V · 50Hz → Type C / A → 큰 C/A 콘센트 그림 → 숙소에 따라 콘센트 모양이 달라요.**
- Type C를 먼저 표시하고 각각 **둥근 2핀 / 납작한 2핀** 설명을 붙였다. 기존 로컬 React SVG와 확대·중앙 정렬 규칙을 재사용한다. C의 실제 구멍·핀은 원형으로 그리며 A의 기존 모양은 유지한다.
- 상세 팝업은 ‘한국 제품 사용 조건 / 현지 콘센트 / 챙길 준비물’ 세 질문으로 구성한다. D/F는 상세 설명에만 둔다.
- INPUT 100–240V, 50/60Hz 대응 충전기의 조건부 사용, 220V·60Hz 전용 기기의 제조사 확인, 고전력 어댑터 허용 전력을 안내한다. 모든 한국 제품 사용 가능으로 단정하지 않는다.
- 두꺼운 접지형 F와 C의 호환을 보장하지 않는다. 어댑터가 전압·주파수를 바꾸지 않는다는 점과 접지 유지 조건을 표시한다.
- 버터 옐로 준비물 영역에 충전기·케이블 / 권장 어댑터 / 가져가는 경우의 드라이어·고데기 점검을 구분했다. 드라이어·고데기를 자동 준비물로 추가하지 않는다.

## 출처 확인

| 실제 확인한 원문 | 확인한 내용 |
| --- | --- |
| [베트남 국가관광청 영문 Plan your trip](https://vietnam.travel/node/26/) | Power plugs 항목의 220V, 대부분 둥근 2핀 수용, 필요 시 어댑터·숙소 확인 |
| [ICAO 2026 AAC/6 Meeting Bulletin](https://www.icao.int/sites/default/files/APAC/Meetings/2026/2026%20AAC-6/General%20Information/Attachment-B-Meeting-Bulletin.pdf) | 3쪽 6.4: 220V·50Hz, A/C/D, 필요한 경우 어댑터 |
| [Panasonic 국가별 전기 규격](https://panasonic.jp/tourist/en/electricity.html) | Vietnam 행의 220V·50Hz, A/C/F. 제조사 원문이며 정부기관 자료로 표시하지 않음 |

요청된 관광청 한국어 경로는 응답에서 전기 항목을 확인하지 못해 같은 공식 사이트의 영문 원문을 사용했다. 한국어 응답은 조사 파일 `raw/vn-electricity/tourism-ko-research.html`로 구분한다. 팝업에는 실제 읽은 위 세 출처와 확인일을 연결한다. JNTO 등 타국 전기 출처를 붙이지 않는다. 자료별 유형 차이는 숙소에 모든 형태가 있다는 의미로 해석하지 않는다.

## 체크리스트·저장

기존 코드에 어댑터 물품 ID는 없었다. 새 국가 공통 ID **electronic:travel-adapter** 하나를 정의하고 모든 베트남 도시에 재사용한다. 전자기기 카테고리에서 ‘준비 권장’과 요청한 추천 이유를 표시한다.

이미 전자기기 카테고리에 사용자가 추가한 같은 이름의 어댑터가 저장돼 있으면 기존 custom ID를 유지하고 기본 어댑터를 중복 생성하지 않는다. 기존 체크 상태·사용자 물품·localStorage 키·스키마 버전은 유지한다. 일반 항목과 같이 체크·해제할 수 있고, 기존 PACK LESS에서 제외 및 복원할 수 있다. 제외를 새 기본 추천이 취소하지 않는다.

## 수정 파일

- `src/service/data/electricity.ts`: VN 공통 규격, C 유형, 사용·준비물 안내, 어댑터 ID·기존 물품 식별.
- `src/service/data/sources.ts`: 베트남 관련 실제 확인 출처 3건.
- `src/service/data/plugVisuals.ts`, `src/service/travel-info/PlugVisuals.tsx`: C/A 순서·둥근 핀 그림·한글 형태 라벨.
- `src/service/my-bag/TripBrief.tsx`: 베트남의 Type C/A 문구.
- `src/service/travel-info/ElectricityInfo.tsx`, `ElectricityInfo.css`: 기존 팝업 내 사용 조건과 준비물 영역.
- `src/service/my-bag/bag.ts`, `MyBag.tsx`: 베트남 어댑터 추천, 기존 사용자 물품 재사용과 사유 표시.
- `tests/vn-electricity.test.mjs`: 네 도시·출처·추천·저장·제외·기존 사용자 물품 검증.
- 기존 `tests/plug-visuals.test.mjs`, `tests/tw-electricity.test.mjs`: 미지원 국가 목록에서 새로 지원한 VN만 제외.
- `scripts/verify_vn_electricity_ui.mjs`: 실제 화면 흐름 검증.

## 검증

실제 TRIP SETUP에서 네 도시 각각 국가·도시·날짜·목적·수하물을 선택하고 MY BAG을 생성했다. PC 1440px, 모바일 390px·320px, 총 **12개 흐름 통과**.

- 220V·50Hz, Type C/A 순서, 그림과 한글 라벨 일치.
- 그림 중앙 정렬 및 PC 110px / 모바일 88px 유지. PC 세 카드 높이 일치. 페이지·팝업 가로 넘침 없음.
- 기기 사용 조건·준비물 영역·베트남 관련 출처 3개 표시.
- 어댑터 중복 ID 없음, 체크 후 새로고침 복원. 다낭에서 해제·PACK LESS 제외·복원도 실제 조작 확인.
- 기존 도시별 평균기온 표시 및 기후 회귀 테스트 통과. 다른 국가의 어댑터 자동 추가 없음.
- 저장된 사용자 어댑터 ID·체크 상태·중복 방지는 추가 단위 테스트로 검증.
- 전체 테스트 **72개**, TypeScript 및 Vite 프로덕션 빌드 통과. 브라우저 예외·검증 중 외부 요청 0건.

기존 기후·항공 반입 데이터는 수정하지 않았다. 외부 이미지/API·신규 서버/DB·유료 또는 종량제 서비스는 추가하지 않았다.

[검증 결과](verification/vn-electricity/ui-results.json) · [PC 카드](verification/vn-electricity/card-1440.png) · [모바일 카드](verification/vn-electricity/card-390.png) · [PC 준비물 안내](verification/vn-electricity/packing-1440.png) · [모바일 준비물 안내](verification/vn-electricity/packing-390.png)
