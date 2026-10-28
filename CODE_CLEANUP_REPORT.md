# 파일·중복 코드 정리

## 2026-10-29 기획정리

- Planning 01~04 및 상단 문구·반응형 정보 구조, 홈의 모바일 2열 요약 카드 개선을 반영했습니다.
- 미사용 `.planning-section-number`, 빈 800px 미디어 쿼리, 단일 ID를 감싼 불필요한 `:is()` 및 과도한 빈 줄을 정리했습니다. 앱 진입점과 테스트용 데이터 공개 진입점은 유지했습니다.
- 실행 중이 아닌 QA Chrome 프로필과 반복 생성한 중간 Planning PNG 910개, 140,404,938 bytes(133.90 MiB)를 정리했습니다. 최종 캡처·기존 보고서가 참조하는 자료·각 단계 측정 JSON·공식 출처·의존성 및 Git 작업 사본은 보존했습니다.
- `vercel.json`, `.vercel`, `.gitignore`, `.github`, 환경 파일, Git 설정·원격을 수정하지 않았습니다. 기존 `node_modules/.cache/cleanup-checkout`에서 커밋·일반 push에 필요한 Git 명령만 사용합니다.
- PASS: 단위 테스트 94개, TypeScript/Vite 빌드, Chrome 1920/1440/1280/1024/820/768/430/390/375/360/320px 레이아웃·목차 이동·복귀 검사. CSS 정리 전후 상세 섹션 높이가 동일합니다. [최종 측정](docs/verification/planning-compact/header-after/results.json)
- 실제 iPhone Safari와 배포 후 운영 화면은 이번 정리에서 테스트하지 않았습니다.


## 2026-10-27 재점검 및 기획 정리 반영

- 앱의 정적·문자열 동적 import, CSS `@import`, 테스트 참조를 확인했습니다. 누락 상대경로 0개. `data/index.ts`, `countries.ts`는 테스트용 공개 진입점이며 `typography.css`는 CSS import로 사용하므로 유지했습니다. 삭제할 미사용 컴포넌트 파일은 발견하지 않았습니다.
- 앱 TS/TSX/CSS의 바이트 동일 파일은 없습니다. 동일한 태국/베트남 JMA 설명 원본은 국가별 수집 계보가 있어 유지했습니다. 의미상 모든 중복 코드를 없앴다는 뜻은 아닙니다.
- `src/styles/archive.css`의 이전 구현 예정 화면 스타일 6개와 `src/styles/responsive.css`의 해당 화면·사라진 note/상태 배지 스타일 4개를 제거했습니다. 현재 TS/TSX에 클래스 참조가 없는 10개 규칙만 정리했습니다.
- `node_modules/.cache` 내부의 비활성 QA Chrome 프로필 18개를 제거했습니다. 확보 용량 **776,110,179 bytes / 740.16 MiB**. 절대경로 범위·Git 디렉터리 부재·실행 중 Chrome의 프로필 사용 여부를 확인했습니다. 실제 사용자 프로필·의존성·Playwright/WebKit 도구·Git 작업 사본·출처·QA 증거는 삭제하지 않았습니다.
- 최신 Planning 목차, 01 AI LAB Overview, 02 문제→차별화 기능 대응과 고객 결제 문제를 목격한 실제 경험 문구를 반영합니다. 기존 START SCREEN·요약 스탬프·PACK LESS/FINAL CHECK 일러스트·LAST CALL 티켓·iOS 입력 방어 등 앞선 세션의 승인된 로컬 수정도 함께 반영합니다. 이번 정리 때문에 앱 기능이나 여행 데이터를 새로 바꾸지 않았습니다.
- README와 MAINTENANCE_AUDIT의 현재 폴더 역할·재사용 규칙을 유지합니다. 새 기능 폴더나 임시 중복 컴포넌트를 만들지 않았습니다.

### 검증

- PASS: 기존 단위 테스트 94개, 실패 0개.
- PASS: TypeScript/Vite 프로덕션 빌드.
- PASS: Chrome/Windows WebKit × 1440/820/390px × 아카이브 홈/Planning/서비스 START SCREEN의 18개 조합에서 CSS 정리 전후 좌표 동일, 가로 넘침·JS 예외 없음. [검사 결과](docs/verification/cleanup-20261027/results.json)
- 앞선 Planning 검증: 목차·01·02 반응형 및 키보드·앵커 확인. [최신 02 검사](docs/verification/planning-differentiation/results.json)
- NOT TESTED: 실제 iPhone 및 이번 커밋의 Production 배포 완료·브라우저 재검증. 로컬 통과를 Production 수정 완료로 간주하지 않습니다.

### 커밋 범위와 보호

원래 폴더에 `.git`이 없어 기존 `node_modules/.cache/cleanup-checkout`의 main 작업 사본을 사용합니다. 원격 최신 main을 먼저 확인하고, 요청 메시지 `수정 및 기획 오버뷰 정리`로 커밋 후 일반 push합니다. `.gitignore`, Git 설정·원격, `.github`, `vercel.json`, `.vercel`, 환경 파일과 배포 루트는 변경하지 않습니다. 커밋·푸시에 필요한 Git 메타데이터 갱신만 수행합니다.

줄바꿈만 다른 텍스트와 과거 Production QA 기록의 로컬 변경은 이번 커밋에서 제외합니다. 공식 원본은 로컬과 HEAD blob이 동일함을 확인하고 체크아웃의 줄바꿈 변환을 커밋하지 않습니다. 대량 누적 이미지 대신 새 보고서가 직접 연결하는 증거와 최신 검사 JSON만 선별합니다. 캐시 삭제는 Git에 포함되지 않는 로컬 용량 정리입니다.

---

2026-10-26. Git/Vercel 설정 파일은 변경하지 않았습니다.

- 실제 앱 진입점·동적 import·CSS import·테스트 참조를 조사했습니다. 데이터의 공개 export는 테스트가 사용하므로 유지하고, service.css가 참조하는 typography.css도 유지했습니다.
- 현재 라우트가 통합 입력 화면으로 이동하므로 사용하지 않는 Destination.tsx/.css, TripDetails.tsx/.css, TripProgress.tsx/.css 6개를 제거했습니다. 기존 URL의 redirect는 App.tsx에 그대로 남습니다.
- TripBrief.css의 이전 article형 카드·링크·월별 링크·더 이상 렌더링하지 않는 액체류 안내 스타일을 제거했습니다. 모바일 비교 영역 숨김은 유지했습니다.
- 거의 동일하던 verify_trip_brief_density.mjs와 verify_baggage_footer.mjs를 scripts/helpers/verifyTripBriefLayout.mjs로 공통화했습니다. 포트·프로필·결과 폴더·각 검사의 높이/SVG 검증 차이는 옵션으로 유지합니다. 미사용 import와 변수를 제거했습니다.
- 검증된 여행 데이터·공식 원문·과거 보고서 증거는 삭제하지 않았습니다. 대량 QA 캐시와 node_modules/dist/환경 파일은 커밋 대상이 아닙니다.
- 전체 테스트 94개 및 TypeScript/Vite 빌드 PASS. 실제 Chrome에서 9개 너비×오사카/뉴욕의 카드 높이·링크·모달 회귀 검사 PASS.

원래 작업 폴더에는 .git이 없어 기존 Princesongg/pack-my-bag_project의 main을 node_modules/.cache/cleanup-checkout에 별도로 복제했습니다. 원래 폴더를 git init하지 않고, 기존 원격/설정을 변경하지 않습니다. 로컬의 최근 카드 개선과 QA 파일도 이번 `세부수정` 커밋 대상으로 동기화합니다. 일반 main push만 사용하며 force push는 하지 않습니다. GitHub 연동에 따른 자동 배포가 시작될 수 있지만 Vercel 설정이나 CLI 배포는 변경/실행하지 않습니다.
