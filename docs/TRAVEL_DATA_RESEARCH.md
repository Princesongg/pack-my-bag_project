# PACK MY BAG STEP 04-1 — 공식 자료 조사 및 데이터 설계

확인일: **2026-10-23 (Asia/Seoul)**. 이 단계는 데이터와 조사 도구만 추가한다. 화면·라우팅·저장 상태·스타일은 수정하지 않는다. 런타임 네트워크 호출, 실시간 예보·환율, AI 연동, 추천 결과 UI는 없다.

## 파일 구성

`src/service/data/`

- `types.ts`: 기존 `countryId`, `cityId`에서 도출한 타입, 출처·확인일·통계 기간·확인 상태, 기후 관측 및 통계 타입
- `sources.ts`: 공식 출처 레지스트리 및 조회
- `countries.ts`, `cities.ts`: 기존 ID/명칭 재사용, 국가 조사 상태, 기상관측소 및 계절 특징
- `climate.generated.ts`: 공식 원본에서 추출한 480개 월별 관측 행과 48개 평년값 행
- `raw/jma/*.html.gz`: 원본 응답 바이트를 gzip으로 보존한 41개 스냅샷
- `raw/jma/collection-manifest.json`: 원본 URL·관측 기간·확인일·SHA-256
- `climate.ts`: 최근 10년 평균 계산, 공식 평년값 분리, 항목별 명시적 대체, 여행 월 구간 조회
- `electricity.ts`, `assets/plugs/type-a.svg`: 전압·주파수·플러그 식별자와 설명용 SVG 연결
- `currencies.ts`: 통화 및 시간대·한국과의 시차, 향후 시기별 UTC 오프셋 구조
- `entryGuides.ts`: 한국 일반여권 단기 관광 기본 조건과 공식 서비스
- `baggageRules.ts`: 전 화면 공통으로 사용할 수 있는 항공 규정 구조만 준비
- `clothing.ts`: 체크리스트 물품 ID와 서비스 자체 작성의 비활성 기본 추천 규칙
- `notices.ts`: 요청한 출처·기후·옷차림·입국·항공 안내 문구
- `index.ts`: 다음 단계 화면용 데이터 진입점

조사 도구: `scripts/collect_jma.py` (Python 표준 라이브러리만 사용).

검증: `tests/travel-data.test.mjs`, `tests/helpers/load-ts.mjs`. 기존 테스트 패키지 외 새 의존성은 없다.

## 실제 확보한 기후 자료

기관: **일본 기상청 JMA**.

| cityId | 관측소 | prec_no | block_no | 실제 확보 기간 | 월별 행 |
|---|---|---|---|---|---:|
| tokyo | 東京 | 44 | 47662 | 2016-01 ~ 2025-12 | 120 |
| osaka | 大阪 | 62 | 47772 | 2016-01 ~ 2025-12 | 120 |
| fukuoka | 福岡 | 82 | 47807 | 2016-01 ~ 2025-12 | 120 |
| sapporo | 札幌 | 14 | 47412 | 2016-01 ~ 2025-12 | 120 |

4개 도시 × 10개 연도 × 12개월 = **480개 월별 행**. 월평균 기온, 일최고 기온의 월평균, 일최저 기온의 월평균, 월강수량 합계의 **1,920개 관측 수치**를 확보했다. 이번에 필요한 네 열에는 결측·준정상 등 표식이 없고 모두 정상 숫자값이다. 원본의 다른 열에 있는 품질 문제까지 없다는 뜻은 아니다.

공식 다운로드 진입점은 [JMA 과거 관측자료 다운로드](https://www.data.jma.go.jp/risk/obsdl/index.php)다. 실제 수집은 같은 기관의 [월별 관측 HTML 표](https://www.data.jma.go.jp/stats/etrn/view/monthly_s1.php?prec_no=44&block_no=47662&year=2016&month=&day=&view=)를 사용했다. CSV 내보내기를 했다고 표시하지 않는다. 각 도시·연도에 대한 정확한 URL은 생성 데이터와 manifest에 있다.

별도로 [JMA 공식 1991–2020 평년값](https://www.data.jma.go.jp/stats/en/normal/normal.html)의 4개 도시 × 12개월 = **48개 행, 192개 수치**도 추출했다. 서로 다른 기준 기간의 값은 별도 속성으로 보관한다. 특정 관측소 값은 도시 전체·산간·해안·고도별 미기후를 대표한다고 단정하지 않는다.

### 계산 방법과 추적

`2016–2025`는 이번 버전의 고정 기간이다. 해가 바뀐다고 자동으로 자료가 갱신되지 않는다.

1. 같은 도시·같은 관측소·같은 달·같은 항목을 선택한다.
2. 2016년부터 2025년까지 정상값 10개가 각각 하나씩 존재하는지 검사한다.
3. 10개 값의 합계를 10으로 나눈다. 윤년의 일수로 연도 가중치를 바꾸지 않는다.
4. 소수 둘째 자리로 반올림해 데이터 값으로 제공한다. UI 표시 자릿수는 별도다.
5. 사용한 연도, sourceId, 표본 수, 제외된 자료와 이유를 함께 반환한다.

예: 도쿄 1월 월평균 기온의 열 개 원본값은 `climateArchive.observations`에서 확인할 수 있으며, 이 자료의 산술평균은 **5.90°C**다. 공식 1991–2020 평년값은 **5.4°C**로 별도 저장된다. 두 값의 차이를 기후변화량으로 해석하지 않는다.

| 도시 / 1월 | 평균 기온 °C | 평균 최고 °C | 평균 최저 °C | 월강수량 평균 mm |
|---|---:|---:|---:|---:|
| 도쿄 | 5.90 | 10.55 | 1.89 | 45.40 |
| 오사카 | 6.53 | 10.12 | 3.28 | 41.10 |
| 후쿠오카 | 7.38 | 10.88 | 4.27 | 76.45 |
| 삿포로 | -3.03 | -0.24 | -6.02 | 93.75 |

위 표는 PACK MY BAG의 2016–2025 관측자료 계산 결과다. JMA가 발표한 별도의 공식 10년 평년값이라고 부르지 않는다. 모든 1~12월은 `monthlyClimate`에서 같은 방식으로 계산된다.

[JMA 품질 기호](https://www.data.jma.go.jp/stats/data/mdrr/man/remark.html)에 따라 `)`, `]`, `×`, `///`, `#`, 공백 등의 원문과 상태를 보관한다. 현재 계산 정책은 보수적으로 순수 숫자 정상값만 사용한다. 따라서 준정상값도 자동 합산하지 않는다. 자료가 9개뿐인 경우 9개 평균을 ‘10년 평균’으로 표시하지 않고 `value: null`과 추가 조사 상태를 반환한다. 결측을 0이나 다른 도시 값으로 채우지 않는다.

### 관측소·계절 특징의 한계

- 도쿄의 **2014-12-02 기타노마루 공원으로의 관측지 변경**은 [JMA 백서](https://www.jma.go.jp/jma/kishou/books/hakusho/2015/01-1.html)에서 확인했다. 수집 기간 이전이지만, 이것만으로 전체 기간의 동질성이 확인되는 것은 아니다.
- 네 관측소의 2016–2025 전체 이전·관측 기기·환경·통계 단절 이력을 모두 검토한 것은 아니다. `continuityReview: needs-research`를 결과에 함께 반환한다. 수치 산술평균의 완전성과 장기 비교 가능성을 구분한다.
- 삿포로의 겨울 추위·많은 눈이라는 정성적 특징은 [삿포로시 공식 자료 PDF 3쪽](https://www.city.sapporo.jp/shimin/bunkazai/documents/2sixyou.pdf)에서 확인했다. 그 문서의 수치 기준은 1981–2010년이므로 이 문서의 기온·강수 수치는 현재 자료에 섞지 않았다.
- 나머지 도시의 정성적 계절 특징과 월별 강설·습도·바람 정보는 추가 조사 대상으로 남겼다.

## 공식 자료에서 확인한 국가 정보

- **전기:** [JNTO 전기 안내](https://www.japan.travel/en/plan/plug-and-electricity/)의 100V, 동부 50Hz·서부 60Hz 및 [JNTO FAQ](https://www.japan.travel/en/faq/)의 Type A. [공식 여행 계획 안내](https://www.japan.travel/en/plan/)의 평행한 두 평핀 설명을 도식에 연결했다. SVG는 플러그/콘센트 형태 식별용이며 치수·인증을 나타내는 설계도가 아니다. 모든 시설이 오직 한 형태라는 뜻이 아니다.
- **어댑터/변압기:** 형태 변환과 전압 변환을 구분한다. 특정 한국 기기의 사용 가능 여부·변압기 용량은 확정하지 않고 기기 Input·제조사 확인을 요구하는 서비스 안내로 분리했다.
- **통화:** [JNTO FAQ](https://www.japan.travel/en/faq/)의 일본 엔, JPY, ¥. 환율 숫자는 없다.
- **시차:** [NICT 일본 표준시](https://www.nict.go.jp/en/sts/jst.html)의 UTC+9, [기상청 FAQ](https://bd.kma.go.kr/contest/faq_view.do)의 KST=UTC+9를 바탕으로 차이 0분을 계산했다. 일본의 현재 서머타임 미실시는 [JNTO 공식 안내](https://www.japan.travel/en/plan/)에서 확인했다. 미래 제도 변경 시 재검토한다.
- **입국:** [주부산일본국총영사관 사증 안내](https://www.busan.kr.emb-japan.go.jp/itpr_ko/nsm_021.html)의 한국 일반여권 단기체재 90일 이내 기본 조건을 저장했다. 데이터의 조사 범위는 단기 관광이며, 출장·취업·다른 여권·장기체류에 그대로 적용하거나 입국 허가를 보장하지 않는다.
- **Visit Japan Web:** [일본 디지털청 설명](https://www.digital.go.jp/policies/visit_japan_web)에서 입국심사·세관신고 관련 정보 등록 서비스임을 확인했다. 요청된 [한국어 가이드](https://services.digital.go.jp/ko/visit-japan-web/guide/)는 링크를 보관했으나 도구에서 본문을 읽지 못해 세부 절차와 모든 여행자 의무 여부는 미확인으로 남겼다.
- **세관:** [일본 세관의 여행자 안내](https://www.customs.go.jp/english/passenger/)로 연결한다. 개별 면세 한도·품목 판정은 추가하지 않았다.

## 항공 규정과 옷차림

항공 규정은 이번 요청대로 **구조만** 작성했다. [인천국제공항 공식 제한물품 링크](https://www.airport.kr/ap_ko/905/subview.do)를 연결하고 7개 범주를 마련했지만 `cabin`, `checked`, `limits`는 모두 `needs-research`와 `null`이다. 미확인 값이 반입 허용으로 해석되지 않게 한다. 출발 국가·항공사·노선·환승국·수하물 유형·시행일/종료일을 별도 scope로 관리하며, 공통 전역 UI는 만들지 않았다.

옷차림 물품에는 ID·이름·체크리스트 연결 ID가 있고 규칙에는 이유·권장/선택·기후 조건·계절 검토·목적 ID가 있다. 기본 임계값은 **PACK MY BAG이 작성한 초안 서비스 휴리스틱**이며 공식 기관의 권장 기준이 아니다. `enabled: false`로 두어 결과를 자동 생성하지 않는다. 평균 최고·최저·일교차·강수·계절 특징·여행 목적을 함께 고려하는 구조만 준비했다. 일교차 조건은 월별 평균 최고−평균 최저이며 특정 여행일의 예상 일교차가 아니다. 우산 규칙도 강수량만으로 우천을 확정하지 않는다.

## 다음 TRAVEL INFO 화면에서 사용하는 방법

```ts
import {
  getTripClimate, electricity, currencies, timeZones,
  entryGuides, getSource, travelNotices,
} from './data';

// existingTrip.cityId / departureDate / returnDate를 그대로 전달한다.
const segments = getTripClimate('tokyo', '2026-11-29', '2026-12-02');
// 2026년 11월 2일분 + 12월 2일분. 각 달의 기후는 별도 표시한다.
const november = segments[0].climate;
// november.recent / november.officialNormal은 기준이 다른 자료다.
// recommendedMetrics의 basis, period, label, sourceIds를 항목별로 표시한다.
// continuityReview 및 warnings도 함께 안내한다.
```

도시·기간이 미지원/미확인이면 다른 도시 값으로 대체하지 않는다. 유효하지 않은 날짜나 역순 날짜는 `RangeError`로 거부한다. 월강수량을 여행 일수에 비례 배분해 예보처럼 제시하지 않는다. 기존 선택 가능한 국가·도시 목록은 수정하지 않았으며 베트남·태국·대만의 사실 데이터는 아직 없다.

## 재현 및 검증

```sh
# 공식 자료 재수집: 검토할 날짜를 명시한다.
python scripts/collect_jma.py --verified-on 2026-10-23

# 네트워크 없이 원본에서 동일 결과 재생성. 날짜와 SHA-256 일치 필수.
python scripts/collect_jma.py --verified-on 2026-10-23 --offline

node --test tests/*.test.mjs
npm run build
```

스냅샷 파일의 해시, 각 원본 표의 수치 열 재추출, 480행 완전성, 192개 평균 산출, 결측·품질표시·관측소 불일치·중복 시 거부, 항목별 평년값 대체, 월·연도·윤년 경계, 출처 참조와 미확인 값, 기존 여행 입력 테스트를 검증한다.

모든 기존 `src` 파일의 SHA-256을 작업 전후 비교하여 변경되지 않았음을 확인한다. 새 데이터는 아직 화면에서 import하지 않으므로 기존 Vite JS/CSS 산출물도 동일하다.
