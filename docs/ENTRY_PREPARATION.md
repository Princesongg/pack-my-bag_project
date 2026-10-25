# 국가별 입국 준비 배너

구현·공식 자료 확인일: 2026-10-25.

MY BAG의 노란 여행 요약 아래, 기존 YOUR TRIP BRIEF 카드 3개 위에 가로 알림을 추가했습니다. 새 페이지나 네 번째 요약 카드는 만들지 않았습니다. 기존 ServiceModal, StatusBadge, SourceLinks 및 디자인 토큰을 재사용했습니다.

| 국가 | 배너 | 기본 상태 |
|---|---|---|
| 미국 | 미국 입국 준비 · ESTA | 확인 필요 (목적/체류기간이 불명확하면 추가 확인 필요) |
| 호주 | 호주 입국 준비 · ETA | 확인 필요 (업무 목적은 추가 확인 필요) |
| 일본 | 일본 입국 준비 · 무비자 조건/Visit Japan Web | 확인 필요 (기존 단기체류 범위 밖은 추가 확인 필요) |
| 베트남·태국·대만 | 국가별 무비자 적용 조건·여권 안내 | 일반 입국 절차의 검증이 부족하므로 추가 확인 필요 |

미국 ESTA는 비자가 아닌 전자여행허가, 호주 ETA는 비자(subclass 601)로 구분했습니다. 유효한 미국 비자의 조건, 승인과 입국의 차이, 공식 신청/상태 확인 링크를 안내합니다. 정부 수수료가 발생할 수 있음을 설명하며 무료 신청이나 고정 요금을 안내하지 않습니다. 신청은 외부 공식 서비스에서 사용자가 직접 합니다.

## 상태·저장·체크리스트

- `entryPreparationConfirmed`라는 개인 확인용 boolean만 기존 BagState에 선택 필드로 추가했습니다. 정부 승인/여권/비자 번호나 사진은 입력·저장하지 않습니다.
- 기존 여행별 bagStorageKey(국가·도시·날짜·목적·수하물 유형)를 그대로 사용합니다. 다른 여행의 상태를 복사하지 않습니다. 기존 버전1 저장값과 체크 상태를 유지합니다.
- 확인 전은 '확인 필요', 개인 확인 후는 '직접 확인함'입니다. 조건 미검증이면 개인 확인 후에도 '추가 확인 필요'를 유지하고, 개인 확인 기록과 안내의 불확실성을 별도로 설명합니다.
- 모달의 '여권을 챙겼어요'는 기존 `essential:passport`의 물품 체크와 동기화합니다. 비자 확인과 여권 물품 체크는 서로 다릅니다. 별도 중복 물품을 생성하지 않습니다.
- '여권 유효기간 점검'은 기존 PACKING RED FLAGS의 PassportCheck를 엽니다. 입력한 여권 만료일의 임시 사용 원칙은 그대로 유지합니다.

## 출처와 제한

- [미국 정부 USAGov](https://www.usa.gov/visa-waiver-esta): VWP/ESTA, 공식 신청·상태 확인 경로를 확인했습니다. [공식 ESTA](https://esta.cbp.dhs.gov/)는 앱에서 외부 링크로만 연결합니다.
- [CBP의 GovInfo 보존 자료](https://www.govinfo.gov/content/pkg/GOVPUB-HS4_100-PURL-gpo172341/pdf/GOVPUB-HS4_100-PURL-gpo172341.pdf): 2018 자료의 허가 성격·비자와의 구분·입국 비보장만 참고했습니다. 오래된 수수료·육로 규정은 사용하지 않았으며 출처 제목에도 제한을 명시합니다.
- [주한 호주대사관](https://southkorea.embassy.gov.au/seol/ETA601.html): 한국 여권의 목적별 ETA 신청 및 Australian ETA App 경로를 확인했습니다.
- [호주 내무부 ETA601](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601): 요청한 공식 링크를 제공하되 동적 본문 추출 제한은 `partially-verified`, 확인일 null로 기록했습니다. 세부 자격·비용을 새로 확정하지 않았습니다.
- 일본은 기존 entryGuides의 한국 일반여권 단기체류·Visit Japan Web, 6개국 여권 조건은 기존 passportRules를 재사용합니다. 베트남·태국·대만의 미검증 입국신고 절차·비자 조건은 추가하지 않았습니다.

## 실제 검증

- `node --test tests/*.test.mjs`: 88개 통과/0실패. 새 기능의 개인 확인 boolean 복원·기존 체크 보존·여행별 저장 키 분리·공식 링크·상태 전이 검사 3개 포함.
- `npm.cmd run build`: TypeScript 및 Vite 빌드 성공.
- `node scripts/verify_entry_preparation_ui.mjs`: 8개 도시×1440/390/320px = 24개 실제 Chrome 시나리오 통과. 도쿄·다낭·방콕·타이베이·뉴욕·LA·시드니·멜버른을 검사했습니다.
- START→TRIP SETUP→MY BAG 생성, 배너 위치, 기존 카드3개, 모달의 국가별 내용/공식 링크, 확인 상태 저장·새로고침, 다른 날짜의 여행에서 상태 초기화, 기존 여권·충전기 체크 유지, RED FLAGS 전환 시 단일 모달 및 포커스 복귀, 날씨/전압 상세를 확인했습니다.
- 가로 넘침 없음, 브라우저 예외0, 앱 런타임 외부 요청0. 정부 링크의 클릭 후 실제 신청·로그인·정부 승인 조회는 실행하지 않았습니다.
- [실행 결과](verification/entry-preparation/ui-results.json)에 상세 기록과 화면 캡처를 보관했습니다. 미국 모바일 배너/모달, 호주 PC 배너는 이미지로도 확인했습니다.

주요 파일: `src/service/data/entryPreparation.ts`, `sources.ts`, `src/service/my-bag/EntryPreparationBanner.tsx`, `EntryPreparationBanner.css`, `MyBag.tsx`, `bag.ts`, `tests/entry-preparation.test.mjs`, `scripts/verify_entry_preparation_ui.mjs`.

유료/종량제 API, 정부 승인 조회 API, 새로운 서버·DB·인증 서비스는 추가하지 않았습니다. 국가별 기후·전압·항공·여권 판정 규정과 기존 저장 키는 변경하지 않았습니다.
