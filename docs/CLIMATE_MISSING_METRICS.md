# 나트랑·푸꾸옥 기후 모달 수정

확인일: 2026-10-25

## 원인과 데이터 판단

`vnClimate.generated.ts`의 두 관측소 모두 12개월 평균 최고·최저가 명시적으로 null이다. `stationClimate.ts`는 이를 그대로 반환하므로 도시 ID나 조회 연결 문제는 아니다. 기존 WeatherGuide가 값 유무와 관계없이 세 기온 카드를 만들고, 숫자용 strong에 결측 안내를 출력한 것이 넘침의 원인이다.

JMA 48877(나트랑: 12.22N, 109.22E), 48917(푸꾸옥: 10.22N, 103.97E)의 평년 표는 월평균 기온과 강수량을 제공한다. JMA 자료 설명에서 이 두 평년 항목의 기준은 1991–2020년이다. 개별 연도의 일최고·일최저 월평균과 30년 평년값을 구분했다.

나트랑 WMO WWIS 도시 3027은 최고·최저 자료를 제공하지만 좌표가 12.26N, 109.20E로 JMA와 다르며 관측소 번호의 동일성을 확인하지 못했다. 이 자료를 JMA 관측소의 값으로 합치지 않았다. 푸꾸옥도 동일 관측소·기간·정의의 공식 최고·최저 평년값을 확인하지 못했다. 검색에서 확인하지 못한 것이 자료의 전 세계적 부재를 의미하지는 않는다.

기후 데이터 수치·출처 메타데이터는 변경하지 않았다. 12월 나트랑 25.1°C / 228.4mm, 푸꾸옥 27.1°C / 76.9mm를 유지한다. 최고·최저는 미확인 상태로 유지한다.

## 화면 처리

공통 ClimateMetrics와 climateMetricsModel에서 유한한 값이며 needs-research가 아닌 항목만 표시한다. 0은 유효한 값이다. 온도 세 항목이 있으면 기존 세 온도 카드와 강수량 행을 유지한다. 일부만 있으면 확인된 항목을 2열로 배치하고 한 항목만 있으면 1열로 표시한다. 전부 없으면 숫자 카드 대신 짧은 문구를 표시한다.

누락된 최고·최저 안내는 별도 문구(PC 14px, 모바일 13px)이다. 숫자는 PC 32px, 모바일 28px이며 단위는 작은 글자로 분리하여 좁은 화면에서 자연스럽게 줄바꿈할 수 있다. minmax(0,1fr), min-width:0, 메타데이터 줄바꿈을 사용하며 overflow:hidden으로 숨기지 않는다.

## 검증

- `node --test tests/*.test.mjs`: 76개 통과. 결측·NaN·미검증값·0 강수량 및 기존 국가 데이터 검증 포함.
- `npm.cmd run build`: TypeScript 및 Vite 통과.
- `node scripts/verify_climate_missing_ui.mjs`: 1440 / 390 / 320px에서 6개 시나리오씩 18개 통과. 나트랑·푸꾸옥은 2026-12-10~15 실제 여행 생성 경로로 확인했다.
- 두 도시에서 평균/강수량 2열, 카드 넘침 없음, 숫자/안내 글꼴 크기, 추천 체크리스트 ID 연결, 출처 표시, 나트랑 비 대비 항목의 새로고침 후 체크 유지 확인.
- 하노이·다낭 전체 지표, 다낭 연말 월 전환, 오사카 기존 데이터도 같은 화면 검증 통과. 브라우저 오류 및 외부 런타임 요청 없음.
- 화면 및 결과: `docs/verification/climate-missing/`.

## 공식 확인 경로

- 나트랑 JMA: https://ds.data.jma.go.jp/gmd/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?e=7&k=0&m=9&n=48877&r=1&s=1&y=2026
- 푸꾸옥 JMA: https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=48917
- JMA 자료 정의: https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html
- 나트랑 WMO 대조: https://worldweather.wmo.int/en/city.html?cityId=3027 (공개 JSON: https://worldweather.wmo.int/en/json/3027_en.json)

나트랑 NrmMonth URL은 정상 표를 확인할 수 없어 기존 공식 ClimatView 경로로 대조했다. NOAA의 추정 디렉터리 URL은 404였으며 근거 자료로 사용하지 않았다. 유료 서비스·새 서버·런타임 API는 추가하지 않았다.
