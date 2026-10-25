# 대만 전압·플러그 데이터 누락 수정

확인일: 2026-10-25

## 실제 원인

- `src/service/data/electricity.ts`의 구조화된 전기 규격은 JP만 등록되어 있었다.
- `TripBrief.tsx`는 JP만 해당 데이터를 읽고, 나머지는 `getInternationalProfile`로 조회했다. 이 프로필에는 US·AU만 있어 TW가 누락되었다.
- 상세 `ElectricityInfo.tsx` 역시 일본 분기와 미국·호주 프로필 분기만 있어 대만을 미준비 상태로 표시했다.
- 국가 ID는 선택부터 저장까지 `TW`로 일치한다. `Taiwan`/`taiwan` 불일치나 도시별 국가 데이터 덮어쓰기는 발견되지 않았다. 존재하는 검증 데이터를 오판한 문제가 아니라 등록·조회 분기 누락이었다.

## 수정

국가 공통 `electricity.TW`에 일반 전압 **110V**, 주파수 **60Hz**, 플러그 **A/B**와 출처를 등록했다. 공통 `getCountryElectricity`와 `getElectricityBrief`를 사용해 카드와 팝업이 같은 수치를 읽는다. 도시별 전기 데이터는 만들지 않았다.

현재 지원하는 **타이베이(taipei)·가오슝(kaohsiung) 전체**에 적용된다.

- 카드 메인: `110V · 60Hz`
- 카드 보조: `Type A / B · 변환 어댑터 준비`
- 상세: 한국 플러그와의 차이, INPUT 100–240V 및 60Hz 대응 확인, 220V 전용 제품의 변압기 검토, 어댑터는 전압을 바꾸지 않는다는 점을 설명한다.
- 일부 시설의 220V는 상세에만 두고 기본 전압 배열에는 110만 등록했다. 시설별 실제 전압 표시 확인을 안내한다.
- 기존 카드 CSS·높이·정렬·모달 동작은 유지했다. 일본·미국·호주의 값과 기존 표시도 유지했다.

기존 체크리스트에는 전압 기반 준비물 추천 연결이나 어댑터 물품 ID가 없었다. 이번 작업은 카드·팝업에서 준비를 권고하며, 기존 ID 재사용 조건에 따라 새 ID나 자동 물품을 만들지 않았다. 사용자 체크 상태·기후 추천·PACK LESS는 변경하지 않았다. 항공 전자기기·보조배터리 안내도 별개로 유지했다.

## 공식 출처

- [대만관광청 FAQ](https://www.taiwantour.or.kr/introduction/faq.html): 일반 110V·60Hz·납작 2핀과 한국 여행자의 어댑터·전압 대응 안내 확인.
- [타오위안시 공식 관광 전기전압](https://travel.tycg.gov.tw/ko/service/electricity): Type A·Type B, 60Hz, 110V 또는 220V 시설 및 제품 전압·주파수 확인 안내 확인.
- 요청된 [타이베이 관광 페이지](https://www.travel.taipei/en/information/electricitycommunication)는 403으로 본문을 확인하지 못했다. 검증된 출처로 등록하지 않고 위 두 공식 자료를 사용했다.

확인된 두 출처와 실제 확인일 2026-10-25는 상세 팝업의 기존 출처 영역에 표시한다. 런타임 외부 API·인증·유료 서비스·서버·DB 추가는 없다.

## 수정 파일

- `src/service/data/electricity.ts`: TW 국가 데이터, Type B, 공통 국가 조회 및 요약 함수.
- `src/service/data/sources.ts`: 확인한 공식 출처 2건.
- `src/service/my-bag/TripBrief.tsx`: 공통 요약 연결.
- `src/service/travel-info/ElectricityInfo.tsx`: 국가 데이터 기반 상세 표시.
- `tests/tw-electricity.test.mjs`: 전체 지원 도시, 수치·출처·기존 국가·체크 상태 검증.
- `scripts/verify_tw_electricity_ui.mjs`: 실제 MY BAG 흐름 자동 검증.
- `docs/verification/tw-electricity/`: 결과 JSON 및 실제 화면 캡처. 프로덕션 `dist/`는 빌드로 갱신.

## 검증

PC 1440×1100 / 모바일 390×1100에서 각각 타이베이·가오슝·오사카·뉴욕·시드니를 실제 선택하고 여행 날짜·목적·수하물 입력 후 MY BAG을 생성했다. 총 **10개 흐름 통과**.

- 두 대만 도시: 카드 110V · 60Hz, Type A / B 표시. 상세 어댑터·변압기·전압 및 주파수 확인·일부 220V 안내 표시.
- 두 대만 도시: 새로고침 후 같은 전기 규격 유지, 체크리스트 확인 상태 복원.
- 일본: 100V · Type A, 50 / 60Hz 유지.
- 미국: 110–120V · 60Hz · 2핀 또는 3핀 유지.
- 호주: 220–240V · 50Hz · 역 V자 평핀 호주형 유지.
- PC 카드 세 개 높이 일치. PC·모바일 페이지 및 모달 가로 넘침 없음. 실제 캡처 시각 점검 완료.
- 대만 선택 후 항공 수하물 모달의 전자기기 안내 3개 카드도 별도로 정상 표시.
- 브라우저 예외 0건, 외부 요청 0건.
- 전체 테스트 **64개 통과**, TypeScript 및 Vite 프로덕션 빌드 통과.

[결과 JSON](verification/tw-electricity/ui-results.json) · [PC 카드](verification/tw-electricity/taipei-card-1440.png) · [모바일 카드](verification/tw-electricity/taipei-card-390.png) · [PC 팝업](verification/tw-electricity/taipei-modal-1440.png) · [모바일 팝업](verification/tw-electricity/taipei-modal-390.png)
