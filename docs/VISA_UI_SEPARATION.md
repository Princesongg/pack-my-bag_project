# 비자 안내 역할 분리

2026-10-25. 기존 규정을 새로 변경하지 않고 안내 범위와 표시 조건만 정리했습니다.

## 데이터와 렌더링

`src/service/data/visaRequirements.ts`에 국가별 `type`, `label`, `summary`, `points`, `officialLinks`, `sourceIds`를 둡니다. `type`은 `none | eta | esta | visa`이며 현재 일본·베트남·태국·대만은none,미국esta,호주eta입니다.

`EntryPreparationBanner`는 조회값이 없거나 `type === 'none'`이면null을 반환합니다. 따라서 숨김 대상에 배너·모달·빈 래퍼·예약 여백이 생성되지 않습니다. none은 한국 일반여권 단기 관광 기준의 UI 노출 설정이며 개인별 비자 자격 확정이나 장기/업무 목적의 비자 면제를 뜻하지 않습니다.

미국·호주는 `VISA / ENTRY PERMISSION` 제목,ESTA/ETA 확인 배지,요약,핵심포인트3개,공식링크를 표시합니다. 유효한 다른 비자·개인별 예외를 고려해 '무조건 신청 필요'라고 표현하지 않습니다. 미국ESTA는 비자가 아닌 전자여행허가,호주ETA는subclass601비자로 구분합니다. 기존 확인 출처를 재사용했고 새로운 규정/수수료 숫자를 만들지 않았습니다.

## 역할과 상태 보존

- 비자 모달에서 여권 유효기간 문구·점검 버튼·여권 물품 체크·입국신고 체크·입국신고 규정·여권 출처를 제거했습니다.
- 여권 만료일 입력·달력 계산·경유 조건·실제 입국일 안내는 기존 RED FLAGS/PASSPORT CHECK에 유지했습니다. 여권 만료일은 계속 임시 입력이며 저장하지 않습니다.
- RED FLAGS에 중복되던 비자 상세 설명은 제거하고 입국신고 절차 안내와 개인 점검 체크만 유지했습니다.
- 비자 조건 개인 확인은 기존 authorization 체크와만 연결합니다. 입국신고 확인 여부가 비자 모달의 개인 확인 상태를 좌우하지 않습니다.
- 기존 체크리스트의 여권 물품 자체,입국신고/비자 개인 확인 기록·저장키·버전은 유지합니다. 숨김 국가의 기존 입국 확인 기록을 삭제하지 않습니다. 카드 숨김은 해당 국가에 비자가 언제나 불필요하다는 확정 판정이 아닙니다.

## 변경 파일

1. `src/service/data/visaRequirements.ts`: 국가별 비자 UI 데이터 및 조회.
2. `src/service/my-bag/EntryPreparationBanner.tsx`: 비자 전용 내용·조건부 노출.
3. `src/service/my-bag/EntryPreparationBanner.css`: 제거된 여권/신고 레이아웃 스타일 정리.
4. `src/service/my-bag/MyBag.tsx`: 여권/입국신고 관련 배너 props 제거.
5. `src/service/my-bag/PackingRedFlags.tsx`: 중복 비자 상세 설명 제거,여권 검사 유지.
6. `tests/visa-requirements.test.mjs`, `scripts/verify_visa_separation_ui.mjs`: 데이터·실제 화면 회귀 검사.

## 실제 검증

- `node scripts/verify_visa_separation_ui.mjs`: **6개국×1440/390/320px =18건PASS**. 실제 MY BAG에서 카드3개 유지,비자안내노출/미노출,모달내용·공식링크,여권입력/체크부재,확인상태동기화,RED FLAGS의여권입력·경유조건유지,포커스복귀와가로넘침을 확인했습니다.
- 일본/베트남/태국/대만: 배너DOM 자체 없음.
- 미국: ESTA내용·공식링크 표시,여권전용UI없음.
- 호주: ETA내용·공식링크 표시,여권전용UI없음.
- `node --test tests/*.test.mjs`: **94개PASS/0실패**.
- `npm.cmd run build`: TypeScript·Vite빌드PASS.
- [실제 화면 결과](verification/visa-separation/results.json). 미국390px모달은이미지로도확인했습니다.

기존 전체E2E/입국배너 자동화 중 '6개국 모두 배너 있음'이나 '배너에서 여권점검으로 이동'을 전제로 한 과거 스크립트는 이번 의도적 UX 변경 이후의 검증 근거로 사용하지 않았습니다. 이번 역할 분리 전용18건과94개모델테스트를 실제 실행했습니다. 국가별 모든 도시·실기기·정부승인시스템을 이번 작업에서 재검사했다고 주장하지 않습니다.
