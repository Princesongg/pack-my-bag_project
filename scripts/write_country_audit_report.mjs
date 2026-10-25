// Assemble the audit from recorded evidence, not from new travel data.
import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/verification/country-data-audit/';
const a=JSON.parse(readFileSync(root+'inventory.json')),h=JSON.parse(readFileSync(root+'http-results.json')).results,comparison=JSON.parse(readFileSync(root+'content-comparison.json')).comparisons,ui=JSON.parse(readFileSync(root+'ui-results.json'));
const link=(id)=>{const s=a.sources.find(s=>s.id===id);return s?`[${id}](${s.url})`:id;};
const keys=['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC','precipitationMm'];
const countryRows=a.cities.map(c=>{
 const climate=c.countryId==='AU'?'수치·연결 존재 / 원문 재접근 미검증':c.countryId==='US'?'기온 정상 / 강수량 데이터 누락':c.id==='danang'?'수치 일치 / 관측소·기간 계보 미검증':c.id==='hanoi'?'계산 참고값 / 기간 계보 추가 확인':['nhatrang','phuquoc'].includes(c.id)?'평균·강수 정상 / 최고·최저 누락':c.countryId==='TH'?'수치 일치 / 기관 간 동질성 추가 확인':'정상';
 const entry=['VN','TH','TW'].includes(c.countryId)?'여권 규칙 존재 / 일반 입국 가이드 누락':'여권·입국 가이드 존재 / 법규 전면 재검증 보류';
 const evidence=[...new Set(c.months.flatMap(m=>Object.values(m.metrics??{}).flatMap(x=>x.sourceIds)))];
 const status=c.countryId==='AU'?'미검증':c.countryId==='US'||['nhatrang','phuquoc'].includes(c.id)?'데이터 누락':c.countryId==='VN'||c.countryId==='TH'?'일부 미검증':'항목별 정상·미검증 구분';
 return `| ${c.country} | ${c.name} (${c.id}) | ${climate} | ${c.electricity.main}, ${c.electricity.typeSummary} / 정상 | ${c.currency.code} / IANA 연결 정상${['VN','TH','TW'].includes(c.countryId)?'·출처 매핑 누락':''} | ${entry} | 공통 안내 연결 정상·개별 항공사 미확인 | ${evidence.map(link).join(', ')} | ${status} |`;
});
const missingRows=a.cities.map(c=>`| ${c.country} ${c.name} | ${keys.map(k=>c.missing[k].length?c.missing[k].join(', '):'없음').join(' | ')} | ${c.countryId==='US'?'공식 PDF에는 강수량 있음, 정적 모델 미등록':['nhatrang','phuquoc'].includes(c.id)?'같은 관측소·기간의 최고/최저 추가 검증 필요':'4개 항목 모두 12개월 존재'} |`);
const stations=a.cities.map(c=>{const m=c.months[0],source=c.countryId==='JP'?'JMA · 최근 10개년 관측':'provenance' in m?(m.provenance?.organization??''):'';return `| ${c.country} ${c.name} | ${m.stationId??a.jpInputQuality[c.id]?.stationId??'도시 지점'} · ${m.provenance?.stationName??c.english} | ${source} | ${keys.map(k=>`${k}: ${c.bases[k].join(', ')}`).join('<br>')} |`;});
const clocks=a.cities.map(c=>`| ${c.name} | ${c.zone.ianaId} | ${c.timeSamples.winter.differenceFromKoreaMinutes.map(n=>n/60).join('/')}시간 | ${c.timeSamples.summer.differenceFromKoreaMinutes.map(n=>n/60).join('/')}시간 | ${c.zone.sourceIds.length?c.zone.sourceIds.map(link).join(', '):'도시 시간대 모델 출처 ID 없음'} |`);
const urlFailures=h.filter(r=>r.httpStatus<200||r.httpStatus>=300||r.blockedMarker).map(r=>`| [공식 URL](${r.url}) | ${r.httpStatus||'응답 없음'} | ${r.error.includes('redirect')?'리다이렉트 반복':r.error.includes('timed out')?'시간 초과':r.error.includes('reset')?'연결 초기화':'접근 차단'} | 미검증 · 링크 내용 오류로 단정하지 않음 |`);
const reviewed={
 'vn-wmo-danang':'최고·최저 24개 일치. 좌표 및 기간 계보 미검증은 별도',
 'vn-wmo-hanoi':'KMA 본문과 동일 수치. JSON의 기간/회원 제출일 계보 추가 확인',
 'th-qsncc-electricity':'HTML의 electricityDescription JSON: 220V/50Hz, C/O, 시설 범위 확인',
 'th-am2026-electricity':'정부 행사 안내: 220V/50Hz, O 및 복합 소켓 조건 확인',
 'th-tat-plugs':'220V, C/F 호환 설명, THB, GMT+7 확인. 모든 시설 보장은 아님',
 'vn-tourism-electricity':'220V 및 둥근 2핀 수용 설명 확인. 50Hz는 Panasonic으로 보완',
 'vn-panasonic-electricity':'베트남 220V/50Hz, A/C/F 행 확인. 제조사 자료임을 구분',
 'th-panasonic-electricity':'태국 220V/50Hz, A/B/C/F 행 확인. O의 부재는 다른 자료로 보완',
 'kr-electricity-comparison':'한국 220V/60Hz, C/F 행 확인. 제조사 자료',
 'jnto-electricity':'100V, 동부50/서부60Hz 및 2핀 설명 확인',
 'jnto-plan':'본문 Timezone의 GMT+9·서머타임 미실시, 통화 yen 확인',
 'kma-kst':'FAQ Q9 본문에서 KST=UTC+9 확인; 제목만으로 불일치 판정하지 않음',
 'taoyuan-tourism-electricity':'110/220V, 60Hz, A/B 확인; 기본110V와 시설220V 구분',
 'us-energy':'미국110–120V/60Hz, 2핀·접지3핀 설명 확인',
 'au-electricity':'220–240V/50Hz 및 역V자2핀·중앙접지 형태 확인',
 'au-facts':'호주 달러 및 전기 규격 본문 확인',
 'iata-passenger-batteries-2026':'2026-03-31판 PDF: 기기·여분·보조배터리 구분 및 용량/개수 조건 확인',
 'molit-power-banks-2026-policy':'국토부 정책브리핑 본문: 4/8 발표,4/20 시행, 최대2개160Wh이하·충전사용 금지 확인',
};
const sourceRows=a.sources.map(s=>{const r=h.find(r=>r.url===s.url.split('#')[0]),c=comparison.find(c=>c.id===s.id);const ok=r.httpStatus>=200&&r.httpStatus<300&&!r.blockedMarker;const content=!ok?'미검증 · 접근 실패':c?.status==='matched'?`본문 수치 대조 일치 (${c.checked}개)`:reviewed[s.id]??'미검증 · 접근만 확인, 주장 전체의 본문 대조 미완료';return `| ${s.id} | [${s.organization}](${s.url}) | ${r.httpStatus||'응답 없음'} | ${content} | ${s.lastVerified??'미기록'} | ${s.snapshot?(s.snapshot.exists&&s.snapshot.hashMatches!==false?'보존 파일·해시 정상':'보존 파일 점검 필요'):'보존 스냅샷 없음'} |`;});
const monthRows=a.cities.flatMap(c=>c.months.map(m=>`| ${c.country} ${c.name} | ${m.month} | ${keys.map(k=>Number.isFinite(m.metrics?.[k]?.value)?Number(m.metrics[k].value.toFixed(1)):'—').join(' | ')} |`));
const badge=ui.results[0].badges.filter((b,i,arr)=>arr.findIndex(x=>x.label===b.label)===i);
const report=`# COUNTRY DATA AUDIT — PACK MY BAG

점검일: 2026-10-25 (Asia/Seoul). 대상은 실제 코드에 등록된 6개국 17개 도시입니다. 국가·도시를 추가/삭제하지 않았습니다.

## 판정과 점검 범위

- **정상**: 해당 수치/주장의 공식 본문 대조와 실제 화면 표시까지 확인. 국가 전체의 모든 규정을 검증했다는 뜻이 아닙니다.
- **연결 오류**: 데이터가 있으나 화면 조회·표시 실패. 아래 D의 3개 경로를 수정했습니다.
- **데이터 누락**: 정적 모델에 항목 없음. 공식 기관에도 자료가 없다는 의미는 아닙니다.
- **출처 오류**: 다른 국가 또는 주장과 무관한 본문을 연결. 이번에 대조한 활성 전압 출처에서 확정된 국가 혼입은 없었습니다. 전 출처의 본문 검증 완료를 의미하지 않습니다.
- **미검증**: 접근 차단, 본문 대조 미완료, 통계 계보·관측소 동질성 미확인. 오류나 정상으로 임의 승격하지 않습니다.
- **해당 없음**: 실시간 환율, 실제 항공사·운임 미입력 상태의 확정 수하물 허용량. 값을 생성하지 않았습니다.

정적 조사: **204개 도시·월 × 4개 핵심 항목 = 816칸, 값 존재 744칸 / 누락 72칸**. 수치 존재 여부와 검증 여부를 별개로 판단했습니다. 새로 받은 공식 HTML 52개 및 직접 확인한 PDF/KMA 표를 포함해 58개 표·2,388개 비교가 모두 일치했고, WMO 다낭 최고·최저 24개도 일치했습니다. 이 비교 횟수에는 일본 10개년 원시 관측이 포함되며 2,412개의 독립 여행정보를 검증했다는 의미가 아닙니다. 공식 숫자에서 파생한 평균은 별도로 구분했습니다.

등록 Source 119개 / fragment를 제외한 고유 URL 113개를 모두 GET 조회했습니다. **101개 2xx / 12개 접근 실패**입니다. HTTP 200은 내용 검증이 아닙니다. 모든 Source의 접근 결과, 직접 대조 여부, 기존 확인일은 부록에 개별 표시했습니다. 보존 스냅샷70개의 파일이 모두 존재하고, 해시가 등록된68개는 모두 일치했습니다. QSNCC·태국정부행사 스냅샷2개는 등록해시가 없어 파일존재만 확인했습니다. 활성 조회에서 발견한 출처 ID 누락·중복도 없습니다.

실제 Chrome 검사: PC1440px·모바일390px에서 **17도시 × 2화면폭 = 34회 여행 생성 흐름**, 각 여행의 2027년12월→2028년1월 모달 탭 68건을 확인했습니다. 1–12월 전체는 정적 모델·공식 표 대조로 검사했고, 204개월을 모두 브라우저에서 클릭한 것은 아닙니다. 입국 규정의 새 법률 해석·전면 재검증은 요청대로 다음 단계로 남겼습니다.

## A. 국가별 전체 현황

| 국가 | 지원 도시 | 기후 | 전압·플러그 | 통화·시차 | 입국·여권 | 항공 정보 | 핵심 기후 출처 | 종합 분류 |
|---|---|---|---|---|---|---|---|---|
${countryRows.join('\n')}

### 관측소·통계기간·정의

| 국가·도시 | 관측소 | 기관 | 항목별 기준 |
|---|---|---|---|
${stations.join('\n')}

일본은 1991–2020 평년값과 2016–2025 같은 달 10개 관측의 산술평균을 구분합니다. 실제 활성 추천값은 후자이며 480개 원시 월 관측의 4항목 모두 정상 품질입니다. 30년 공식 평년값이라고 표시하지 않습니다.

하노이 평균은 같은 도시의 평균 일최고·일최저 중간값을 반올림한 **서비스 계산 참고값**입니다. 공식 직접 월평균 관측값으로 승격하지 않았습니다. 호주 평균 역시 최고·최저의 중간값으로, BOM 직접 월평균이 아닙니다. 시드니 기온1939–2026·강수1929–2026, 멜버른2013–2026의 전체 가용 관측기간이며 월별 유효 연수와 최고·최저 표본 수가 다를 수 있습니다. 1991–2020으로 통일하지 않았습니다. 호주는 이번 원문 재접근이 403이므로 보존 자료와 화면이 일치하더라도 현재 공식 원문 수치 재검증은 **미검증**입니다.

다낭은 JMA48855(평균·강수)와 WMO도시656(최고·최저)의 게시 좌표가 다릅니다. 같은 관측소라는 근거가 확보되지 않았습니다. 태국 3개 도시는 JMA/TMD의 WMO번호와1991–2020기간은 같지만 게시 위치·고도와 기관별 월평균·강수 수치가 다릅니다. 예를 들어 방콕1월 JMA평균27.6°C와 TMD27.4°C는 서로 다른 발표값입니다. 현재 항목별 출처·주의문은 있으나 통계 동질성을 확인한 단일 계열이라고 해석해서는 안 됩니다. **값을 평균내거나 임의 교체하지 않고 계보 확인을 P1로 남깁니다.** 푸껫은 공항48565이며 시내48564의 값이 아닙니다.

WMO 하노이·다낭 JSON은 통계기간 메타데이터1991–2020과 별도로 climateFromMemDate가2001/2002년입니다. 이 필드가 평년값 갱신일인지 단순 최초 회원 제공일인지 이 자료만으로 확정할 수 없습니다. 숫자·화면의 일치는 확인했으나 기간 계보는 별도 **미검증**으로 남깁니다. 이를 근거로 현재 값을 과거 다른 기간의 값이라고 단정하지도 않았습니다.

## B. 월별 기후 누락 현황

누락 월은 항목별로 명시합니다. 없는 값에 0, 다른 도시 값, 평균에서 역산한 최고·최저를 넣지 않았습니다.

| 국가·도시 | 평균기온 누락 월 | 평균 최고 누락 월 | 평균 최저 누락 월 | 강수량 누락 월 | 실제 원인 |
|---|---|---|---|---|---|
${missingRows.join('\n')}

- 나트랑·푸꾸옥: 각24칸, 총48칸의 최고·최저가 **정적 모델에서 null**입니다. 조회 연결 실패가 아닙니다. JMA 해당 표는 평균·강수만 제공합니다. 다른 자료의 관측소·기간 일치 확인 전 추가하지 않습니다. 실제 화면은 평균/강수 2열과 작은 보조문구로 정상 표시되고, null에 큰 숫자 스타일이 적용되지 않았습니다.
- 미국2도시: 각12칸, 총24칸의 강수량이 **정적 모델에 미등록**입니다. NWS Central Park PDF2쪽과 NOAA LAX PDF2쪽에는 같은1991–2020의 월강수량(inches)이 실제 존재합니다. 공식 자료 자체 부재가 아닙니다. 단위 변환·검증·추천 영향 검토를 거쳐 별도 등록할 수 있습니다. 이번 보고서 작업에서는 숫자를 추가하지 않았습니다.
- 나머지13도시는 핵심4항목이12개월 모두 존재합니다. 호주 원문 접근 및 복수기관의 통계 동질성 제한은 위 A와 별개입니다.
- 옷차림은 공식 권장 복장이 아닌 서비스 규칙의 검토 제안으로 표시됩니다. 강수는 여행일 비 확률이 아니며, 최고·최저가 없으면 일교차를 역산하지 않습니다. 나트랑1–2월은 평균25°C 미만·강수100mm미만·최고/최저null 때문에 관광 목적에서 운동화만 제안됩니다. 동작 오류는 아니지만 온도에 맞는 의류 안내가 빈약한 **P2 추천 범위 개선 후보**입니다.

## C. 출처 오류·재검증 목록

### 국가 혼입 및 근거 범위

| 출처/항목 | 연결 국가 | 점검 결과 | 조치 |
|---|---|---|---|
| JNTO 전압 | 일본 | 일본에서만 활성 연결. 미국·호주·베트남·태국·대만 전압 모달 혼입 없음 | 유지 |
| DOE Electricity101 | 미국 | 실제 본문110–120V/60Hz와 2/3핀·접지 설명 확인 | 유지 |
| Tourism Australia Key Facts | 호주 | 실제220–240V/50Hz·역V자 핀·중앙접지 설명 확인 | 유지 |
| QSNCC·태국정부 행사 안내 | 태국 | 본문/HTML 데이터에서 C/O 및시설별A/B/F 설명 확인. QSNCC시설이 모든 숙소 대표라는 뜻은 아님 | 시설 차이·접지 확인 문구 유지 |
| Panasonic | 한국 비교·베트남·태국 | 제조사 원자료의 국가별 행은 맞음. 국가 정부기관 자료와 구분 필요 | 정부 전기표준으로 오인하지 않기 |
| 타오위안 관광 | 대만 | 110/220V·60Hz·A/B를 설명. 기본110V와 일부220V를 구분 | 유지. 대만관광청 FAQ 접근 실패는 별도 |
| KMA 빅데이터 FAQ | 일본-한국 시차 비교 | 제목은 콘테스트지만 Q9에 KST=UTC+9가 실제 있음 | 제목만 보고 출처 오류로 분류하지 않음 |
| WMO 하노이·다낭 | 베트남 | 값은 일치하나 기간 메타데이터와 오래된 회원 제공일의 계보 추가 확인 필요 | P1 미검증; 임의 기간 변경 금지 |
| 다낭 JMA/WMO, 태국 JMA/TMD | 베트남·태국 | 항목별 근거는 있으나 동일 계열 통계로서의 동질성 미확인 | P1 계보 확인; 단일계열처럼 단정하지 않기 |
| CBP Article1238 | 미국 여권 보조 링크 | HTTP200이지만 요청 규정 본문을 확인하지 못함. 기존 needs-research/null 확인일 | 확정 근거 사용 금지 유지; FAM 주 근거와 구분 |
| 통화·도시 시간대 sourceIds | VN/TH/TW (JP 도시시간대도 빈 배열) | 값·IANA는 있고 동작 정상. 공식 근거 태그가 공통 모델에 연결되지 않음 | P2 출처 매핑 누락; 새 검증 배지 부여하지 않음 |

대조 범위 안에서 확정된 다른 국가 출처 혼입은 없었습니다. 링크는 열리지만 본문을 대조하지 못한 나머지 자료는 아래 부록에서 **미검증**으로 분류했습니다. 출처 오류가 없다고 전면 보증하지 않습니다.

### 이번 GET 조회에서 접근하지 못한 공식 URL 12개

| URL | HTTP | 원인 | 분류 |
|---|---|---|---|
${urlFailures.join('\n')}

기존 lastVerified는 일괄 갱신하지 않았습니다. 과거의 확인 기록과 이번 접근 결과를 별도로 남깁니다. 접근 실패를 근거로 기존 공식값을 삭제하거나 정상으로 재승인하지 않았습니다. 항공 국토부 원 링크는 리다이렉트 반복이나 이미 연결된 정부 정책브리핑 대체 자료 본문은 확인했습니다.

## D. 코드 연결 오류 및 수정

| 발생 위치 | 원인·증상 | 수정 | 결과 |
|---|---|---|---|
| EssentialInfo.tsx 전압 접힌 요약 | JP전용값 또는US/AU프로필만 조회. VN/TH/TW 데이터는 있어도 '세부 정보 확인 필요' | 기존 getElectricityGuide 공통 조회로 요약 구성 | 6개국17도시 PC/모바일 확인 |
| EssentialInfo.tsx + InternationalInfo.tsx 통화·시차 | getInternationalProfile이US/AU만 반환해 VN/TH/TW는 PendingInfo 또는 null | 기존 getCountryCurrency와 getTripTimeOffsets 재사용. 공식 출처 미연결 통화는 추가 확인 안내 | 기존 통화/IANA 표시 복구. 0분은 '한국과 시차 없음' |
| WeatherGuide.tsx 미등록 기후 fallback | 알려진 시간대이면서America가 아니면 AU로 간주 | 실제 destinations의 cityId→countryId로 해당 프로필만 조회 | 잠재적 호주 출처 혼입 방지. 현재17도시는 모두 기후값이 있어 기존 정상 흐름에서는 드러나지 않았던 오류 |

애플리케이션 수정 파일은 **src/service/travel-info/EssentialInfo.tsx, InternationalInfo.tsx, WeatherGuide.tsx** 세 개입니다. 국가 수치·SVG·여권/항공 규정·공식 출처 레코드·저장 키/스키마는 변경하지 않았습니다. 기존 공통 함수와 데이터만 재사용했습니다.

## 통화·현지 시각

코드/명칭/기호: JPY(일본 엔,¥), VND(베트남 동,₫), THB(태국 바트,฿), TWD(신타이완 달러,NT$), USD(미국 달러,$), AUD(호주 달러,A$). 환율 수치는 제공하지 않습니다. VN/TH는 이미 등록된 관광청 본문에도 통화 근거가 있으나 currency 모델 sourceIds가 없어 후속 연결이 필요합니다. TW 통화의 공식 근거 재검증은 보류했습니다.

아래는 여행 날짜 표본 2027-01-10 / 2027-07-10의 **한국 대비** 시차입니다. 양수는 빠름, 음수는 느림입니다.

| 도시 | IANA | 1월 | 7월 | 도시 모델의 출처 |
|---|---|---|---|---|
${clocks.join('\n')}

현재 시계는 new Date()를 IANA로 표시하며 여행 예정일을 현재 시각에 대입하지 않습니다. 실제 브라우저에서 ${ui.clockTest.before}→${ui.clockTest.after}로 분 경계 갱신을 확인했습니다(${ui.clockTest.elapsedMs}ms 대기). 도시를 바꾼34회 흐름에서 라벨·현재시각 표시를 확인했습니다. DST 겨울/여름 및 전환일 테스트도 통과했습니다. 여행 날짜 시차는 날짜별 UTC정오 표본이며 비행기 도착시각 변환 기능이 아닙니다. 미래 시간대 법규 변경을 보장하지 않습니다.

## 입국·여권 데이터 재고

| 국가 | 현재 여권 계산 | 기타 저장된 정보 | 남은 점검 |
|---|---|---|---|
| 일본 | 체류 종료일까지 유효 | 한국 일반여권 단기체재90일 가이드, VisitJapanWeb·세관 | 대사관403 재검증. legacy entryGuides의 잔여월수pending과 PassportRule의 체류유효 안내 중복 정리 |
| 베트남 | 입국일+달력6개월 | 일반 무비자 범위2025-03-15~2028-03-14, 최대45일이라는 기존 조사 기록 | 외교부 연결 실패; 법령/PDF의 상세 법률 재검증 및 일반 입국 UX는 다음 단계 |
| 태국 | 입국일+달력6개월 | 체류 허용일수는 여권 판정에 사용하지 않음 | TAT여권 링크403; 무비자/TDAC 등 일반 가이드 미구축 |
| 대만 | 입국일+달력6개월 | BOCA근거, 한국 일반여권 조건 | 일반 입국 가이드 미구축. 법규 전면 재검증은 별도 |
| 미국 | 체류 종료일까지 유효 | 한국 여권6개월 추가 면제, ESTA/VWP 별도 확인 | VWP링크403,CBP본문미검증. FAM 주 근거와 보조 자료 구분 |
| 호주 | 체류 종료일까지 유효 | ETA자격 조건 및항공사/경유지 별도 | 일반 비자 FAQ시간초과; 여권 FAQ와 같은 링크가 아님 |

여권 계산은 KR일반여권·단기관광·일반무비자 및경유조건 확인을 요구합니다. 불명확하면 추가확인 상태이며, 날짜 충족은 입국 보장이 아닙니다. 달력6개월의 월말 처리를 테스트했습니다. 번호·사진을 요구하지 않고 만료일은 컴포넌트 임시 상태로만 관리합니다. 이번에 법규 값을 추측해 수정하지 않았습니다. 여권 모달 진입은 전 도시 브라우저 확인, 개인정보 저장 금지는 기존 단위 테스트 및 별도 여권 브라우저 검사 스크립트로 재검사할 수 있습니다.

## 항공·수하물

- 일반 안내와 실제 항공사 허용량을 구분합니다. 실제 항공권 확인 입력이 없으면 '허용량 확인 필요'이며 임의 kg/무료 개수 기본값이 없습니다. 사용자 입력의 개수/개당무게와 총무게 방식을 별도로 검증합니다.
- '기내만 가능'/'위탁 금지'는 baggageLabels와 StatusBadge 공통 variant를 사용합니다. 34개 흐름에서 요약/전자기기 상세에 있는 동일 라벨의 배경·글자·테두리 computed style이 일치했습니다: ${badge.map(b=>`${b.label} = 배경 ${b.background}, 글자 ${b.color}, 테두리 ${b.border}`).join('; ')}.
- 내장 배터리 기기는 기내 권장·위탁은 항공사 조건부/완전종료, 보조·분리 여분은 위탁 금지, 전자담배는 국가별 허용 자체를 별도 확인합니다. 보조배터리 최대2개를 모든 여분 배터리에 확대하지 않습니다.
- ${link('iata-passenger-batteries-2026')}와 ${link('molit-power-banks-2026-policy')}에서 용량 표현 차이를 확인했습니다. IATA의 보조배터리100Wh이하/100–160Wh금지와 국토부160Wh이하 표현을 서로 대체하지 않습니다. 현재 앱은 100Wh초과를 확정 허용하지 않고 항공사/국가 확인으로 안내합니다. 기내 충전·사용 금지와 시행일4/20·발표4/8·확인10/25도 구분합니다.
- 액체100mL/1L,스프레이등은 한국출발 적용 범위가 있는 기존 안내입니다. 국가 선택만으로 모든 항공사·출발국 규정이 바뀌는 구조가 아닙니다. 나머지 항공 품목의 최신 예외 전체는 이번에 전면 재검증하지 않았으므로 링크 접근만 성공했다고 정상으로 확정하지 않습니다.

## E. 우선순위

| 우선순위 | 항목 | 상태·권장 조치 |
|---|---|---|
| P0 | 입국·항공안전의 확정 오정보 | 이번 대조에서 확정된 위험 오정보는 발견하지 못함. 이것은 전 규정 최신성 보증이 아님. 접근불가 입국근거와 항공예외는 다음 작업 첫 검증 대상으로 유지 |
| P1 | VN/TH/TW 요약 전압·통화 누락 | **수정 완료**, 공통 조회 및34개 실제 흐름으로 확인 |
| P1 | 기후 미등록 fallback의 AU출처 오연결 | **수정 완료**, 실제 도시의 국가로만 조회 |
| P1 | 다낭 관측소 동질성·WMO기간 계보,태국기관간계보 | **미검증**, 단일 관측계열로 취급하기 전 확인. 대규모 데이터 교체는 하지 않음 |
| P2 | 미국 강수24칸 | 공식자료는 존재. 같은 관측소·기간 및inch→mm 검증 후 등록 |
| P2 | 나트랑·푸꾸옥 최고/최저48칸 | 같은 관측소·기간 자료 확인 전 null유지. 현재 동적UI정상 |
| P2 | 호주 원문403 및국가별 미검증출처 | 공식재접근/공식보존판으로 갱신 여부 비교. 과거확인일 일괄갱신 금지 |
| P2 | VN/TH/TW 일반입국 가이드와통화/시간대 출처ID | 데이터 재고·여권 규칙과 구분해 순차 검증·연결 |
| P2 | 나트랑1–2월 의류제안 부족 | 평균만 있는 중간기온 범위의 서비스 추천 규칙 개선 검토 |
| P3 | 옷차림 안내의 개발용 문구·메타데이터 | WeatherGuide의 '같은 물품 ID' 노출과 clothingPolicy.enabled=false/실제 preview 동작 설명 정리. 이번 데이터 감사에서 UI문구는 변경하지 않음 |

## F. 다음 작업 권장 순서

1. 접근불가 여권·입국 공식 근거부터 재검증하고, 출국국/경유/국적/목적/시행일을 분리합니다. 항공 기준도 실제 항공사 승인과 일반 안내를 계속 구분합니다.
2. WMO기간 메타데이터 계보와다낭 관측소,태국JMA/TMD동질성을 확인합니다. 실패하면 단일 출처 세트 선택 또는 '기관별 별도 통계'를 더 명확히 구분하는 방안을 제안한 뒤 교체합니다.
3. 공식자료가 확보된 미국 강수량을 단위·관측소·기간별로 등록합니다. 나트랑/푸꾸옥최고최저는 별도 공식자료 확보 후 추가합니다.
4. VN/TH/TW입국자료와 통화/IANA출처 연결을 공통 구조에서 정리하고, 나트랑 평균기온 전용 추천 범위를 검토합니다.
5. 미검증Source의 주장별 본문 대조를 완료하고 정적 스냅샷·확인일·자료 시행일을 독립 관리합니다.

## 테스트와 재현

- node scripts/audit_country_data.mjs: 17도시·204개월·816칸, 누락/출처ID/보존파일 조사.
- node scripts/audit_country_sources.mjs: 개발단계 공식URL113개 GET(수동 네트워크 허용 환경 필요). 앱 런타임과 무관.
- node scripts/audit_country_content.mjs: 새로 받은 표와 저장값 비교58표/2388칸. 추가 WMO24칸은 wmo-review.json 참조.
- node scripts/verify_country_audit_ui.mjs: Chrome실제사용흐름34건/월탭68건, 요약-모달수치·플러그타입/출처·배지컬러·여권모달·체크보존·모바일누락요약 회귀 검사 통과. 페이지/모달/기후카드 가로넘침 없음. 외부런타임요청0,브라우저예외0.
- node --test tests/*.test.mjs: **83개 통과/0실패**. 국가ID,기후/원문/해시/기준기간,옷차림,어댑터,날짜/DST,여권,항공조건,수하물허용량,MYBAG/PACKLESS/RED FLAGS 등을 포함합니다.
- node scripts/verify_passport_ui.mjs: **18? ???? ??**. ??? ??????? ???????? ??? ??. ?? ???? ?? ???? ??? ??.
- npm.cmd run build: **TypeScript 및 Vite 프로덕션 빌드 성공**.
- screenshot은 모바일 나트랑·푸꾸옥 기후와 각국 PC/모바일 여행정보화면을 보존했습니다. 나트랑모바일은 직접 이미지도 확인했습니다. 캡처는 탭전환 후1월장면입니다. 모든 화면의 모든 스크롤 위치를 사람이 직접 육안검사한 것은 아닙니다.

근거: [inventory.json](${root}inventory.json), [HTTP전체결과](${root}http-results.json), [본문수치대조](${root}content-comparison.json), [WMO계보검토](${root}wmo-review.json), [브라우저결과](${root}ui-results.json), [시계실측](${root}clock-result.json).

수정/추가 파일: 앱3개(D참조), scripts/audit_country_data.mjs, audit_country_sources.mjs, audit_country_content.mjs, verify_country_audit_ui.mjs, write_country_audit_report.mjs, 이 보고서 및 docs/verification/country-data-audit의 정적 증거. 새 서버·DB·외부인증·유료/종량제API·런타임날씨API·환율API는 추가하지 않았습니다. 기존localStorage키/스키마/사용자체크를 보존했습니다.

## 부록1. 등록 출처119개 전체 점검표

모든 링크는 점검일에 접근을 시도했습니다. **'접근만 확인'은 본문 미검증**입니다. 표의 기존확인일은 코드에 있던 기록이며 이번 감사의 재승인일이 아닙니다. 링크에 #page가 달라도 GET은 같은PDF에 대해1회 수행했습니다.

| Source ID | 기관·실제 URL | HTTP | 이번 본문 검증 상태 | 기존확인일 | 스냅샷 |
|---|---|---|---|---|---|
${sourceRows.join('\n')}

## 부록2. 전체 도시·월의 현재 화면용 수치

단위: °C, mm. 소수첫째자리 표시기준입니다. —는 데이터없음이며 0이 아닙니다. 계산참고/기간/관측소/출처는 A와 inventory.json을 함께 보세요. 이 표의 값 존재가 모두공식검증완료를 뜻하지 않습니다.

| 국가·도시 | 월 | 평균기온 | 평균 최고 | 평균 최저 | 월평균 강수량 |
|---|---|---|---|---|---|
${monthRows.join('\n')}
`;
writeFileSync('COUNTRY_DATA_AUDIT.md',report);
console.log('COUNTRY_DATA_AUDIT.md written:',a.cities.length,'cities,',a.sources.length,'sources,',monthRows.length,'monthly rows,',ui.results.length,'browser flows');
