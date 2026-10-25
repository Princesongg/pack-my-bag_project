# 전압 출처 분리 및 콘센트·플러그 시각화

작업·재확인일: 2026-10-25

## 출처 오류 원인 및 수정

ElectricityInfo가 공통 기본값으로 electricity.JP를 선택하고, US/AU 프로필의 전기 출처에 일본용 deviceCaution.basedOn을 합쳤다. SourceLinks는 전달된 ID를 정상 출력했으며 국가 코드 오류는 아니었다. 그 결과 일본 출처뿐 아니라 일본의 100V 기기 주의 문구도 다른 국가에 표시되었다.

일본을 기본값으로 선택하는 처리를 제거했다. 국가별 전기 출처 조회는 getElectricitySourceIds로 분리하고 US/AU는 해당 프로필의 전기 출처만 반환한다. 플러그 그림은 출처를 자동 부여하지 않는다. 미국·호주 공통 사용 안내는 특정 국가의 전압을 가정하지 않는 제품 INPUT·어댑터 안내로 수정했다.

| 국가 | 전기 출처 | 확인일 처리 | 그림 |
| --- | --- | --- | --- |
| 미국 | U.S. Department of Energy · Electricity 101 | 본문 재확인, 2026-10-25 | Type A / B |
| 호주 | Tourism Australia · Key Facts About Australia 영문 전기 항목 | 전기 전용 출처 au-electricity 신규 등록, 2026-10-25 | Type I 2핀 / 3핀 |
| 대만 | 대만관광청 FAQ / 타오위안 공식 관광 | 기존 2026-10-25 유지 | Type A / B |
| 일본 | JNTO 전기 규격 자료 | 재확인하지 않았으므로 기존 2026-10-23 유지 | Type A |
| 베트남·태국 | 기존 미수집 상태 유지, 타국 자료 대입 없음 | 날짜 생성 없음 | 임의 그림 추가 없음 |

기존 au-facts의 날짜도 변경하지 않았다. 다른 국가의 기후·통화·입국 출처는 바꾸지 않았다. 검증된 국가 데이터가 없으면 상세에 ‘공식 출처 확인 필요’를 표시한다.

## 실제 확인한 공식 자료

- [미국 에너지부 Electricity 101](https://www.energy.gov/oe/electricity-101): 110–120V·60Hz, 2핀·3핀, 세 번째 접지 핀 설명을 확인했다.
- [호주정부관광청 영문 Key Facts](https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html): “What kind of electrical plugs are used in Australia?”에서 220–240V·50Hz, 역 V자 납작한 2핀과 중앙 세 번째 핀 형태를 확인했다. 요청된 한국어 페이지에는 해당 항목을 찾지 못해 같은 기관 영문 페이지를 사용했다.

## 그림과 UI

정적 코드 기반 SVG를 사용한다. 요약 카드에는 작은 콘센트 도식과 Type 라벨, 상세에는 구멍을 보여주는 콘센트와 금색 핀을 보여주는 플러그 정면을 나란히 표시한다. 미국·대만은 A/B, 호주는 I의 2핀·접지 3핀을 비교한다. 호주의 콘센트는 두 플러그 비교 모두 3구 예시임을 표시한다.

아이보리·블루·버터 옐로 스타일을 유지했다. 모바일에서는 비교 카드를 한 열로 배치한다. SVG에는 각 형태의 접근성 제목이 있으며 실측 도면이 아닌 형태 식별용임을 표시한다. 접지 핀 제거를 권하지 않고, 현지 콘센트에 맞는 출력 핀과 소지 기기에 맞는 입력부를 확인하도록 안내한다. 새 외부 API·유료 서비스·외부 이미지 호출은 없다.

사용자 요청 마지막 문장이 ‘나머지 일본·베트남·태국은 기존’에서 끝나, 이 국가들의 기존 데이터는 유지하는 범위로 진행했다.

## 파일

- src/service/data/international.ts: 미국 재검증 정보 및 호주 전기 전용 출처.
- src/service/data/plugVisuals.ts: 국가별 그림 유형과 출처 조회.
- src/service/travel-info/ElectricityInfo.tsx: 일본 기본값 제거, 국가별 출처와 시각화 연결.
- src/service/travel-info/PlugVisuals.tsx, PlugVisuals.css: 콘센트·플러그 SVG와 반응형 표시.
- src/service/my-bag/TripBrief.tsx: 공통 전압 카드에 작은 형태 도식 연결.
- tests/plug-visuals.test.mjs: 국가별 출처·날짜·미수집 상태·그림 매핑 검증.
- scripts/verify_plug_visuals_ui.mjs: 실제 여행 생성 흐름·출처·SVG·레이아웃 검증.

## 검증

PC 1440px / 모바일 390px에서 타이베이·가오슝·오사카·뉴욕·시드니 총 10개 여행 입력 및 MY BAG 생성 흐름을 실행했다. 국가별 그림 종류·SVG 수·출처 URL을 확인했고, 일본 외 국가의 전기 출처에 JNTO나 japan.travel 링크가 없음을 검사했다. 페이지·모달·그림 영역 가로 넘침 없음, PC 카드 높이 정렬 유지, 저장 복원 및 기존 항공안전 모달 유지도 확인했다.

전체 테스트 66개, TypeScript 및 Vite 프로덕션 빌드 통과. 브라우저 예외·외부 요청 0건.

[결과 JSON](verification/plug-visuals/ui-results.json) · [호주 PC](verification/plug-visuals/sydney-1440.png) · [호주 모바일](verification/plug-visuals/sydney-390.png) · [미국 모바일](verification/plug-visuals/new-york-390.png)
