# PACK MY BAG

React · TypeScript · Vite 여행 준비 서비스와 프로젝트 아카이브입니다.

## 실행 및 검증

```bash
npm install
npm run dev
npm run build
node --test tests/*.test.mjs
```

## 현재 페이지

- `/`: 프로젝트 아카이브 메인, 기획·구현 카드
- `/planning`: 기획 개요와 기존 Figma 보드 링크
- `/implementation`: 실제 서비스 START SCREEN
- `/implementation/workspace`: 국가·도시·일정 입력, MY BAG, 마지막 점검
- `/implementation/travel-info`: 여행 정보 안내
- `/implementation/destination`, `/implementation/trip-details`: 통합 workspace로 이동하는 기존 URL
- `/implementation/my-bag`: workspace의 `?view=bag`으로 이동하는 기존 URL

라우트는 `src/App.tsx`에서 관리합니다. 기존 Vercel SPA rewrite를 유지합니다.

## 폴더와 역할

```text
src/
  main.tsx                       # 앱 진입점·전역 스타일 로딩
  App.tsx                        # 라우팅·TripProvider
  components/archive/            # 아카이브 공통 레이아웃·헤더·푸터
  pages/
    home/                        # 아카이브 메인·전용 카드·일러스트
    planning/                    # 기획 페이지·topics
  service/
    ServiceHome.tsx               # 실제 서비스 START SCREEN
    ServiceHeader.tsx             # 서비스 내비게이션
    service.css, typography.css   # 서비스 공통 스타일
    ServiceHomeCTA.css            # START SCREEN CTA 스타일
    workspace/                   # 서비스 화면 전환·연결
    destination/                 # 여행지 목록·선택 UI
    trip/                        # 통합 입력·상태·저장·날짜 계산
    my-bag/                      # 체크리스트·요약·PACK LESS·마지막 점검
    travel-info/                 # 여행 안내 UI·공유 표시 모델
    data/                        # 여행 데이터·타입·출처·국가별 기후
      raw/                       # 공식 수집 원본·manifest
      assets/plugs/              # 기존 플러그 SVG
  styles/                        # 공통 토큰·리셋·아카이브·반응형
public/                          # favicon·국가별 국기 SVG
scripts/                         # 수집·생성·감사·브라우저 QA
  helpers/                       # 공통 QA 검사
tests/                           # 데이터·계산·저장 테스트와 헬퍼
docs/                            # 조사·설계 문서·verification 증거
```

루트에는 기존 QA 보고서와 설정이 있습니다. `dist/`, `node_modules/`, `*.tsbuildinfo`는 생성 결과이며 기존 `.gitignore`가 제외합니다. `.env.local`, `.vercel/`의 제외 규칙도 유지합니다.

## 앞으로의 파일 관리 규칙

- 기존 화면·모델·스타일·헬퍼를 먼저 검색하고 해당 파일 수정을 우선합니다. 작은 UI 수정마다 파일을 추가하지 않습니다.
- 전용 컴포넌트와 CSS는 해당 기능 폴더에 둡니다. 컴포넌트는 PascalCase, 모델·데이터는 기존 camelCase 규칙을 따릅니다.
- `pages/home`은 아카이브, `service/ServiceHome`은 실제 START SCREEN입니다. 이름이 비슷해도 서로 다른 화면입니다.
- 공통 로직은 기존 `trip.ts`, 기능별 `*Model.ts`, `guideModel.ts` 등을 재사용합니다. 사용처 하나인 코드를 위해 최상위 `utils/`, `hooks/`, `features/`를 미리 만들지 않습니다.
- 모달은 `ServiceModal`, 출처는 `SourceLinks`, 상태 배지는 `StatusBadge`를 먼저 확인합니다. 공통 CSS 토큰을 사용하고 동일 선택자의 임시 덮어쓰기를 반복하지 않습니다.
- 여행지 기준은 `destination/destinations.ts`입니다. `data/countries.ts`, `data/cities.ts`는 이 목록을 재사용합니다. 표시 이름으로 별도 목록을 만들지 않습니다.
- 기후·추천은 기존 countryId·cityId·월 조회 경로를 사용합니다. UI에 국가별 수치나 규정을 복사하지 않습니다. 원본·출처·관측 기간을 유지하고 `*.generated.ts` 변경 전 관련 생성 스크립트를 확인합니다.
- 상태는 `TripContext`와 기존 저장 모델을 사용합니다. UI 변경 때문에 저장 키·체크리스트 ID를 바꾸지 않습니다.
- 삭제 전 정적·동적 import, CSS import·URL, 테스트, 스크립트, 문서 참조를 확인합니다. 앱 번들 미포함만으로 미사용이라고 판단하지 않습니다.
- QA 도구는 `scripts/qaBrowser.mjs`, `scripts/helpers/`를 재사용합니다. 증거는 `docs/verification/<작업명>/`에 두고 기존 보고서 갱신을 우선합니다. 대량 이미지의 Git 반영은 별도 검토합니다.
- 이동 시 import·URL·빌드·관련 테스트를 확인합니다. Git·Vercel 설정, 배포 루트와 public 경로는 구조 정리만을 이유로 바꾸지 않습니다.

현재 점검과 개선 제안은 [MAINTENANCE_AUDIT.md](MAINTENANCE_AUDIT.md)의 2026-10-27 항목을 참고하세요.
