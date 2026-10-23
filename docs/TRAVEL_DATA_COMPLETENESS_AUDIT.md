# 국가별 여행 데이터 완성도 점검

점검일: 2026-10-23 (Asia/Seoul). 현재 코드와 저장된 원본·조사 기록을 대조하고, 아래 공식 웹페이지의 본문을 재확인했다. 이번 작업은 감사 보고서만 추가하며 서비스 UI·데이터·추천 로직은 변경하지 않는다.

## 판정 기준

- **VERIFIED**: 해당 범위의 실제 값·공식 출처·통계/적용 기준을 추적할 수 있다. 해당 국가의 모든 여행 정보가 완성됐다는 의미가 아니다.
- **PARTIAL**: 일부 사실 또는 연결은 확인되지만 요청 범위의 일부가 빠졌다.
- **MISSING**: 화면/함수 또는 자료 조회 링크는 있어도 사용할 실제 국가·도시 데이터가 없다.
- **NEEDS REVIEW**: 표시값·추천 로직은 있으나 공식 근거 추적이나 정책 정합성 검토가 필요하다. 값이 틀렸다고 판정한 것은 아니다.

아래 판정은 코드의 `verified` 문자열을 그대로 복사하지 않은 별도 감사 판정이다.

## 실제 선택 가능한 도시와 기후 수치 연결

출처: `src/service/destination/destinations.ts`. 수치는 `getClimateMonth()`와 `getClothingPreview()`를 각 도시의 1~12월에 실행해 확인했다. 옷차림 후보 생성 테스트 목적은 `sightseeing`이다.

| 국가 | 지원 도시 (cityId) | 세 기온 수치가 모두 있는 월 | 옷차림 후보가 생성되는 월 | 기후 기준 |
|---|---|---|---|---|
| 일본 | 도쿄 `tokyo`, 오사카 `osaka`, 후쿠오카 `fukuoka`, 삿포로 `sapporo` | 각 12/12 | 각 12/12 | 2016–2025 관측값으로 계산한 서비스 10년 평균. 별도 1991–2020 JMA 평년값 보관 |
| 베트남 | 다낭 `danang`, 하노이 `hanoi`, 나트랑 `nhatrang`, 푸꾸옥 `phuquoc` | 각 0/12 | 각 0/12 | 미확보 |
| 태국 | 방콕 `bangkok`, 푸껫 `phuket`, 치앙마이 `chiangmai` | 각 0/12 | 각 0/12 | 미확보 |
| 대만 | 타이베이 `taipei`, 가오슝 `kaohsiung` | 각 0/12 | 각 0/12 | 미확보 |
| 미국 | 뉴욕 `new-york`, 로스앤젤레스 `los-angeles` | 각 0/12 | 각 0/12 | NOAA 조회 경로만 있음. 도시 수치·관측소 없음 |
| 호주 | 시드니 `sydney`, 멜버른 `melbourne` | 각 0/12 | 각 0/12 | BOM 조회 경로만 있음. 도시 수치·관측소·기간 없음 |

합계: 17개 도시 중 4개 도시만 월별 수치 지원. 204개 도시·월 중 48개에 평균·최고·최저 기온이 모두 있다. 나머지 156개는 미확보다.

## 국가별 항목 판정

| 검사 항목 | 일본 | 베트남 | 태국 | 대만 | 미국 | 호주 |
|---|---|---|---|---|---|---|
| ① 도시별 월평균·최고·최저 및 기준 기간 | VERIFIED* | MISSING | MISSING | MISSING | MISSING | MISSING |
| ② 기후 기반 옷차림 추천 | NEEDS REVIEW | MISSING | MISSING | MISSING | MISSING | MISSING |
| ③ 전압·주파수·플러그 유형 | VERIFIED | MISSING | MISSING | MISSING | PARTIAL | PARTIAL |
| ④ 통화 코드·이름·기호 | VERIFIED | NEEDS REVIEW | NEEDS REVIEW | NEEDS REVIEW | PARTIAL | PARTIAL |
| ⑤ 한국과의 시차·서머타임 | VERIFIED | MISSING | MISSING | MISSING | VERIFIED** | VERIFIED** |
| ⑥ 한국 일반여권 기준 입국 준비 | PARTIAL | MISSING | MISSING | MISSING | PARTIAL | PARTIAL |
| ⑦ 항공 반입 규정·출처·적용 범위 | PARTIAL*** | PARTIAL*** | PARTIAL*** | PARTIAL*** | PARTIAL*** | PARTIAL*** |
| ⑧ MY BAG 맞춤 준비물 연결 | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| ⑨ RED FLAGS 공식 안내 연결 | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

### ① 기후

*VERIFIED는 일본 4개 관측소의 월별 수치·기간·원본 추적 및 계산 재현 범위다. 480개 연도별 월 관측 행, 48개 공식 평년값 행이 있고 원본 해시·계산 테스트가 통과한다. 2016–2025 평균은 JMA가 별도로 발표한 공식 10년 평년값이 아닌 서비스 계산값이다. 관측소 이전·관측 환경·통계 단절의 전체 동질성 검토는 `continuityReview: needs-research`로 남아 있다. 강설·습도·바람의 월별 자료가 확보됐다는 의미도 아니다.

비일본 도시는 `getClimateMonth()`가 `recommendedMetrics: null`을 반환한다. 미국 NOAA의 1991–2020 자료 안내나 호주 BOM 조회 링크를 보유한 것만으로 해당 도시의 월별 자료를 확보한 것으로 판정하지 않았다.

### ② 옷차림 / ⑧ 체크리스트

`getDefaultBagItems()`가 실제로 `getClothingPreview()` 결과의 고유 물품 ID를 합친다. 일본에서는 기후 기반 후보가 생성되지만, 임계값은 서비스 휴리스틱이며 공식 복장 기준이 아니다. `clothingPolicy`는 `draft`, `enabled: false`인데 조회 함수는 이 플래그를 사용하지 않고 후보를 생성한다. 계절 특징은 필수 입력으로 선언돼 있으나 실제 필터에서는 강설·바람 등 계절 특징을 검사하지 않는다. 정책·주석과 실제 후보 생성의 의미를 정리해야 한다.

나머지 5개국은 기본 준비물과 사용자 추가 목록만 연결된다. 기후 기반 의류 추천은 0개다. 국가별 어댑터·입국 서류 등을 자동으로 추천하는 완성된 규칙은 없다. 일본도 해당 규칙까지 완성된 것은 아니다. 의류 수량 자동 계산도 없다.

### ③ 전기

일본은 JNTO 출처가 있는 100V, 지역별 50/60Hz, Type A 및 도식이 연결된다. 미국·호주는 공식 전압·주파수·핀 형태 설명이 있으나 구조화된 플러그 ID와 재사용 도식은 Type A만 존재한다. 미국 A/B·호주 I 같은 표준 식별자를 검증·등록하는 작업은 별도다. 베트남·태국·대만은 전기 데이터 자체가 없다.

### ④ 통화

6개국 모두 `currencyDetails`에 코드·이름·기호가 있으며 MY BAG에 표시된다. 일본은 기존 `currencies.JP`와 JNTO FAQ에서 세 필드를 추적할 수 있다. 미국·호주는 통화의 공식 출처가 있고 일부 필드를 뒷받침하지만, 새 `currencyDetails` 자체에 항목별 sourceIds·확인일은 없다. 베트남·태국·대만의 해당 메타데이터는 공식 검증 기록 없이 표시용 값으로 추가됐다. 다음 조사에서 출처를 연결해야 하며, 현재 값이 잘못됐다는 뜻은 아니다.

베트남·태국·대만은 MY BAG 요약에서는 통화가 보여도 기존 TRAVEL INFO의 국가 프로필 분기에서는 통화 상세가 미확인으로 남는다. 데이터 보유와 상세 화면 연결을 구분해야 한다.

### ⑤ 시차

**미국은 뉴욕·로스앤젤레스, 호주는 시드니·멜버른만 대상이다. 도시별 IANA ID와 공식 시간대 안내를 갖고 여행 날짜마다 UTC 정오의 브라우저 Intl 오프셋을 계산한다. 테스트는 남·북반구와 DST 전환을 포함한다. 표준시/DST 적용을 반영한 일자별 참고 시차 범위에서 VERIFIED다. 항공편의 특정 출도착 시각 변환이나 향후 시간대 제도 보장은 아니다. 브라우저 시간대 데이터 버전은 별도 기록하지 않는다.

일본은 공식 UTC+9와 한국 UTC+9를 이용한 시차 0, DST 미실시 자료가 있다. 베트남·태국·대만은 코드에 도시별 시간대·시차 데이터가 없다. 이번 감사에서 미구현 값을 임의로 채우지 않았다.

### ⑥ 입국

일본은 한국 일반여권 단기체재 기본 조건·Visit Japan Web 설명·세관 링크가 있다. 잔여 유효기간 기준은 미확인이며, Visit Japan Web의 모든 여행자 의무 여부도 미확인으로 남아 있다. 관광 중심 자료를 출장·근로 권한 판정으로 확장하면 안 된다.

미국·호주는 VWP/ESTA·ETA 일반 안내와 공식 링크만 있다. 한국 여권의 세부 자격·예외, 여권 유효기간, 체류 한도, 목적별 조건 등을 구조화한 KR 전용 항목은 없다. 미국 공식 안내에 한국이 VWP 대상 국가로 기재됐더라도 현재 코드가 개인별 자격을 판정하는 것은 아니다. 베트남·태국·대만은 국가별 입국 자료가 없다.

### ⑦ 공통 항공 규정

***모든 국가가 같은 한국 출발 국제선 공통 BAGGAGE GUIDE를 사용한다. 액체·보조배터리·전자기기·날카로운 물건·스프레이 5개 범주에 검증 기록과 조건·예외·미확인 항목이 있다. `scope.departureCountryId`는 `KR`이며 현지 출발 귀국편·환승 공항·개별 항공사 규정까지 검증한 상태가 아니다. 기내/위탁의 크기·무게·개수 범주는 미확인이다.

이번 재확인에서 인천공항 액체류 안내와 정부 정책브리핑의 2026-04-20 보조배터리 시행 안내를 확인했다. 국토부 원문 URL은 리디렉션 루프로 본문을 재취득하지 못했으므로, 원문 전체를 새로 확인했다고 기록하지 않는다. 기존 정부 대체 출처로 교차 확인 가능한 범위를 사용했다. 포장·승인·품목별 예외까지 전부 재조사한 것은 아니다.

무료 위탁 허용량은 사용자가 항공권을 확인하고 입력한 별도 기록이다. 국적·국가별 고정 무게가 없고 시스템 검증 완료 자료도 아니다. 이 설계는 유지해야 한다.

### ⑨ RED FLAGS

여권·결제·항공 점검은 6개국 모두 동작한다. 일본은 영사관 입국 자료, 미국·호주는 국가 프로필의 공식 링크가 연결된다. 베트남·태국·대만은 외교부 해외안전여행 첫 화면으로 연결될 뿐 국가별 직접 안내는 아니다. 여권 잔여기간은 국가별 확정값 없이 공식 확인을 요청한다. 결제 안내는 공통 카드사 자료이며 실제 카드 상태를 조회하지 않는다. 항공 점검 역시 위 한국 출발 범위를 따른다.

## 우선순위

1. **P0 — 적용 범위·검증 기록 정리:** 한국 여권·목적·유효기간·입국 절차, 항공 규정의 출발/환승/귀국 범위부터 국가별 공식 자료로 확정한다. 확인되지 않은 규정이나 무료 위탁 무게를 넣지 않는다. `verified()`의 고정 확인일과 코드 상태만으로 검증을 선언하지 않는다.
2. **P1 — 일본 외 13개 도시 기후 확보:** 국가 하나씩 관측소·단위·1~12월 완전성·결측·품질·기준 기간·원본을 저장한다. 2016–2025 관측 평균과 공식 평년값 중 실제 확보한 자료를 표시하고 혼합하지 않는다. 현 기후 타입/조회는 `JapanCityId`, `japanStations`, `isJapanCity`에 의존하므로 다음 구현에서 국가 중립 구조로 확장해야 한다.
3. **P1 — 베트남·태국·대만 기본 정보:** 국가별 공식 전압·주파수·플러그, 통화 출처, 도시별 시간대·DST, KR 입국 안내를 확보한다. 기존 통화 표시값은 유지하되 근거를 보완한다.
4. **P2 — 추천 정합성:** 기후 확보 후 후보 규칙·정책 플래그·계절 조건·목적별 동작을 정리한다. 공식 관측값과 서비스 제안을 분리하고 MY BAG 물품 ID 중복 방지를 재검증한다. 미국·호주의 입국/플러그 구조화도 보완한다.
5. **P2 — 기록과 안내 최신화:** 기존 STEP 04-1 문서는 초기 상태 설명이며 현 코드와 다르다. 항공 규정이 전부 미확인/추천 UI가 없다는 문구, 옷차림 화면의 ‘MY BAG 체크리스트는 아직 생성하지 않습니다’ 안내는 현 구현과 불일치한다. `PACKING_RED_FLAGS.md`는 항공 4개라고 적혀 있지만 코드는 허용량 확인을 포함해 5개다. BC카드 링크도 문서는 `1203858_21560.jsp`, UI는 `1203858_21460.jsp`로 달라 재확인이 필요하다. 이번에는 수정하지 않았다.

국가별 후속 조사 순서는 기본 정보와 기후가 모두 비어 있는 베트남 → 태국 → 대만을 먼저, 그다음 미국·호주의 기후와 한국 여권 기준 세부 조건 보완을 권장한다. 사용자 대상 노출이 많은 국가가 있다면 그 국가를 먼저 진행할 수 있다.

## 공식 출처 재확인 경로

- 일본: [JMA 1991–2020 평년값](https://www.data.jma.go.jp/stats/en/normal/normal.html), [JNTO FAQ](https://www.japan.travel/en/faq/), [전기](https://www.japan.travel/en/plan/plug-and-electricity/), [시간대·DST](https://www.japan.travel/en/plan/), [NICT 표준시](https://www.nict.go.jp/en/sts/jst.html), [주부산일본국총영사관](https://www.busan.kr.emb-japan.go.jp/itpr_ko/nsm_021.html).
- 미국: [NOAA 평년값 자료 안내](https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals), [에너지부](https://www.energy.gov/oe/electricity-101), [공식 통화교육](https://www.uscurrency.gov/), [NIST 시간대](https://www.nist.gov/pml/time-and-frequency-division/local-time-faqs), [국무부 VWP](https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html).
- 호주: [BOM 자료 조회](https://www.bom.gov.au/climate/data/), [관광청 기본 정보](https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html), [시간대·DST](https://www.australia.com/en/facts-and-planning/about-australia/time-zones.html), [정부 비자 FAQ](https://usa.embassy.gov.au/visa-faqs).
- 항공: [인천공항 제한물품](https://www.airport.kr/ap_ko/905/subview.do), [정부 보조배터리 시행 안내](https://www.korea.kr/news/policyNewsView.do?newsId=148962298).

## 검증 내역

- 17개 도시 × 12개월 조회 결과를 실행해 기온 3종 및 옷차림 후보 존재 여부를 확인했다.
- `node --test tests/travel-data.test.mjs tests/travel-guide.test.mjs tests/international.test.mjs tests/destination.test.mjs`: 21개 통과. 일본 원본 스냅샷 해시·원문 수치·평균 산술·품질 처리·DST 및 미확인 도시 처리 등을 포함한다.
- 테스트 통과는 공식 입국/안전 규정의 최신성이나 서비스 휴리스틱의 타당성까지 보증하지 않는다.
- 런타임 파일, 공식 데이터 값, UI, localStorage를 변경하지 않았다. 보고서만 추가했다.
