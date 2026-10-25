# 태국 공식 기후 데이터 연결

자료 직접 확인일: 2026-10-25

## 지원 도시와 자료

기존 태국 지원 도시는 방콕(`bangkok`), 치앙마이(`chiangmai`), 푸껫(`phuket`) 세 곳이다. 도시 목록은 변경하지 않았다. 파타야·코사무이는 등록되어 있지 않으며 다른 도시의 자료를 복사하지 않았다.

| 도시 | WMO 번호 | 평균기온·강수량 | 평균 일최고·일최저 |
|---|---|---|---|
| 방콕 | 48455 BANGKOK METROPOLIS | JMA 12개월 | TMD 12개월 |
| 치앙마이 | 48327 CHIANG MAI | JMA 12개월 | TMD 12개월 |
| 푸껫 | 48565 PHUKET AIRPORT | JMA 12개월 | TMD 12개월 |

모든 항목의 기준 기간은 1991–2020년이다. 평균기온·강수량 36개월은 요청 표와 일치한다. 평균기온은 직접 제공값이며 최고·최저의 평균으로 계산하지 않았다. TMD의 Temperature `Mean max.` / `Mean min.` 행을 사용했으며 `Ext. max.` / `Ext. min.` 행이나 특정 연도의 극값을 사용하지 않았다.

TMD 1991–2020 공식 통계집에서 같은 WMO 번호를 확인했다. PDF 실제 11쪽(인쇄 5쪽), 57쪽(인쇄 51쪽), 89쪽(인쇄 83쪽)을 직접 대조하고 최고·최저 72개 값을 전사했다. 원본 PDF와 전사 파일을 함께 보존했다. 서문은 이 기간에 10년 이상 관측된 지점을 대상으로 한다고 설명한다. 각 항목이 모두 정확히 30개 유효 연도를 가졌다고 가정하지 않는다.

JMA와 TMD의 게시 좌표·일부 고도 및 평균기온 수치에 차이가 있다. 같은 WMO 번호와 기간을 대조했으나 이전 이력·전체 통계 동질성은 미확인으로 명시했다. 항목별 출처를 각각 표시하며 두 기관 수치를 평균내거나 일치시키지 않았다. 푸껫은 시내 48564가 아닌 **푸껫공항 48565** 기준임을 요약 카드와 모달에 표시한다. 숙소·해변 전체를 대표하는 공식 도시값으로 단정하지 않는다.

## 수정 파일과 연결

- `src/service/data/raw/th/`: JMA HTML 5개, TMD 차트 HTML, 공식 PDF, 최고·최저 검증 전사 JSON, SHA-256 수집 명세.
- `scripts/build_th_climate.mjs`: 네트워크를 호출하지 않는 오프라인 생성기. 12개월·관측소 ID·기준 기간을 확인하고 원문 해시를 기록한다.
- `src/service/data/thClimate.generated.ts`: 태국 3개 관측소 월별 정적 데이터와 출처.
- `stationClimate.ts`: 기존 공통 조회에 태국 자료 추가. `getClimateMonth` → `getStationClimateMonth` → `getTripClimate`를 통해 기존 화면과 연결.
- `sources.ts`: 기존 SourceLinks 조회에 태국 출처 등록.
- `ClimateMetrics.tsx`, `WeatherGuide.tsx`, `TripBrief.tsx`: 기존 공통 지표 레이아웃과 출처·푸껫공항 설명 사용. 정상 지표 3개 온도 + 강수량 구성, 부분 자료 2열 구성 유지.
- `clothing.ts`, `guideModel.ts`: 기존 기온·강수량 조건을 재사용. 푸껫 휴양 목적에만 수영복 선택 규칙 추가.
- `bag.ts`, `MyBag.tsx`: 기존 추천 ID를 연결하고 태국 준비물의 짧은 추천 이유를 표시. 체크 상태·저장 형식은 유지한다.

기존 수영복 ID가 없어 `clothing:swimwear`를 한 번 정의했다. 푸껫·휴양·따뜻한 평균기온 조건에서만 선택 후보이며, 다른 도시나 국가에는 생성하지 않는다. 긴팔·가디건·반팔·우산/우비·운동화는 기존 ID를 재사용한다. 방문 월이 여러 개면 동일 ID는 하나로 합친다.

## 추천 차이

| 여행 조건 | 평균기온 | 월강수량 | 추천 차이 |
|---|---|---|---|
| 방콕 2027년 4월 | 30.8°C | 92.7mm | 반팔·관광용 운동화, 우산 자동 추천 없음 |
| 방콕 2027년 9월 | 28.7°C | 343.6mm | 반팔·우산/우비·관광용 운동화 |
| 치앙마이 2027년 12월 | 22.5°C | 10.0mm | 얇은 긴팔·가디건·운동화 |
| 푸껫 2027년 9월 휴양 | 27.7°C | 393.9mm | 반팔·우산/우비·수영복 선택 후보 |

치앙마이 12월은 TMD 평균 일최고 29.2°C·일최저 16.9°C를 참고한다. 기존 외투 규칙은 평균 최저 15°C 미만이므로 이를 임의 변경하지 않고, 기온 차이에 맞는 기존 가디건 규칙으로 연결했다. 강수량이 적고 많은 달의 차이는 월별 수치와 기존 추천 기준으로 반영한다. 달력상 건기·우기나 매일의 날씨를 확정하지 않는다.

강수량은 장기 월평균이며 여행일의 비 확률·예상량이 아니다. 옷차림과 준비물은 공식 기관의 복장 권고가 아닌 서비스 제안이다. 습도·강수일수는 미확인 null 상태다. 대기질·자외선 수준·파도나 해변 안전을 기후 통계로 추정하지 않는다. 자외선 차단품을 관측 기반 필수 물품으로 추가하지 않았다.

## 검증

- `node --test tests/*.test.mjs`: 82개 통과. 36개월 평균·강수량, TMD 지표·극값 구분, 원문 해시·기간·ID·출처, 도시/목적별 추천, 중복 방지·체크 복원, 다른 국가 데이터 검증 포함.
- `npm.cmd run build`: TypeScript 및 Vite 통과.
- `node scripts/verify_th_climate_ui.mjs`: 7개 여행 조건 × PC 1440 / 모바일 390 / 320px = 21개 시나리오 통과.
- 실제 TRIP SETUP → MY BAG → 요약 카드 → 상세 모달 경로에서 A~D 조건, 푸껫 관광/휴양 차이, 치앙마이 2027-12-29~2028-01-03 월·연도 탭 전환을 확인했다.
- 나트랑 2026년 12월은 기존 25.1°C·228.4mm와 최고·최저 미확인 2열 처리를 유지한다.
- PC 카드 높이 정렬, 모든 화면 가로/지표 넘침 없음, 공식 출처·확인일, 준비물 중복 없음, 새로고침 후 체크 유지 통과. 브라우저 예외와 외부 런타임 요청 없음.
- 결과 및 화면: `docs/verification/th-climate/`.

기존 THB·현지시각·전압·PACK LESS·RED FLAGS·LAST MINUTE BAG의 구현 및 다른 국가 원본 데이터는 변경하지 않았다. 기존에 방콕을 “미등록 자료” 예제로 사용하던 테스트는 미지원 도시 예제로 갱신했다.

## 공식 출처

- TMD 기후 차트: https://www.tmd.go.th/en/ClimateChart
- TMD 1991–2020 통계집: https://ubonmet.tmd.go.th/files/MetInfo/climate_normal.pdf
- JMA 태국 관측소 목록: https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/StationList_e.php?ccode=22100
- 방콕: https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=48455
- 치앙마이: https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?e=6&k=0&m=9&n=48327&r=1&s=1&y=2026
- 푸껫공항: https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?e=6&k=0&m=9&n=48565&r=1&s=1&y=2026
- 평년값 정의: https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html

공식 자료 수집은 개발 중 한 번 수행했다. 서비스 실행 중 날씨 API·외부 이미지·유료·종량제 서비스 호출은 없으며 새 서버·DB도 추가하지 않았다.
