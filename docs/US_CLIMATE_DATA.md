# 미국 월별 기온 연결

실제 확인일: 2026-10-23. 기존 UI/CSS와 다른 국가 수치는 변경하지 않는다.

## 공식 자료와 원본

- 뉴욕: [NWS New York Central Park PDF](https://www.weather.gov/media/okx/Climate/CentralPark/nycnormals.pdf). 1991–2020 평년값, 2026-01-01 갱신본의 1쪽 월별 Monthly Average / Average Max / Average Min.
- LA: [NOAA/NCEI LAX PDF](https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&endDate=9996-12-31&format=pdf&startDate=0001-01-01&stations=USW00023174). 관측소 USW00023174, Los Angeles International Airport, 1991–2020 평년값의 1쪽 Mean / Daily Max / Daily Min.
- 원본 PDF 2개와 SHA-256·URL·확인일을 `src/service/data/raw/us/collection-manifest.json`에 보존했다. 매번 내용을 생성하는 NOAA PDF는 이후 재다운로드 시 생성일·해시가 달라질 수 있으므로 저장본과 함께 대조한다.

## 입력·변환·연결

`usClimate.ts`에 24개 도시·월의 원본 화씨 3종 값을 저장했다. `(°F − 32) × 5 / 9`로 환산 후 소수 첫째 자리로 반올림하며 사용자 제공 섭씨 표 72개 수치와 대조했다. 월평균은 공식 Mean을 쓰며 반올림한 최고·최저의 재평균으로 만들지 않는다.

`getTripClimate()` → `getClimateMonth()` → `getUSClimateMonth()` 경로로 기존 `recommendedMetrics` 형태를 재사용한다. 도시 ID는 `new-york`, `los-angeles`다. `basis`는 `official-30-year-normal`, 기간은 1991–2020이며 `recent`는 null이다. 일본의 2016–2025 계산이나 JMA 출처를 재사용하지 않는다.

`WeatherGuide`는 기존 기온·옷차림 카드와 월 선택 UI를 그대로 사용한다. 미국 자료에는 해당 기관·관측 지점·환산 방식·기준 기간·공식 PDF·확인일을 표시한다. 일본의 기존 출처/계산 블록은 유지한다.

`getClothingPreview()`는 기온 3종의 유효성과 같은 기간·기준을 확인한다. 강수량이 없으면 강수 규칙만 제외하며 기온 규칙까지 차단하지 않는다. 강수량을 0으로 대체하지 않고, 서로 다른 기간의 강수값도 옷차림 조건에 섞지 않는다. `getDefaultBagItems()`가 기존 checklistItemId를 재사용해 후보를 MY BAG으로 연결하고 월간 중복은 합친다. 기존 체크·사용자 물품·PACK LESS·RED FLAGS·LAST MINUTE 저장 구조는 변경하지 않는다.

## 실제 지원과 한계

- 두 도시의 1~12월 평균·평균 최고·평균 최저 기온 및 기존 기온 기반 옷차림 후보를 지원한다.
- 뉴욕은 Central Park, LA는 LAX의 통계다. 도시 전체나 숙소의 미기후·실제 여행일 예보가 아니다.
- 미국 2016–2025 관측 평균은 추가하지 않았다. 강수량·강설·습도·바람·정성적 월별 특징은 이번 연결에서 미등록이다. 원본에 다른 열이 있어도 이번 작업에서 추출·검증하지 않은 수치를 자동 사용하지 않는다.
- 옷차림은 공식 기관의 추천이 아닌 PACK MY BAG의 기존 서비스 휴리스틱이다. LA 7월(최고 23.9°C/최저 17.8°C)은 현재 규칙상 얇은 긴팔·도보용 신발 후보가 나오며, 임의로 반팔·가디건 조건을 새로 만들지 않았다.
- 호주·베트남·태국·대만 등 미확보 도시의 안전한 빈 상태는 유지한다.
- `US_AU_SUPPORT.md`와 `TRAVEL_DATA_COMPLETENESS_AUDIT.md`의 미국 기후 미확보 설명은 이번 연결 이전의 점검 기록이다. 현재 미국 기온 지원 범위는 이 문서가 우선한다. 호주 미확보 상태는 그대로다.

## 검증

- `tests/us-climate.test.mjs`: 24개월/72개 섭씨 값, 기간·출처·저장본 해시, 뉴욕 10~11월 구간, 뉴욕 겨울/LA 여름 추천 차이, MY BAG ID 병합, 일본 유지, 미지원 도시 빈 상태.
- 기존 테스트는 미국의 과거 미지원 기대값만 새 지원 범위에 맞게 갱신했다. 호주에 대한 빈 상태 검증은 유지했다.
