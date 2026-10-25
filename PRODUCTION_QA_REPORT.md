# PACK MY BAG — Production QA

검사일: 2026-10-26 (Asia/Seoul).

**Production은 GitHub main 최신 커밋과 일치합니다. 실제 공개 사이트의 Chrome 검사에서 요청된 10개 너비의 주요 흐름과 완료 애니메이션이 통과했습니다. 외부 링크 접근 실패 및 미실행 범위가 있어 전체 항목 PASS는 아닙니다.**

PASS: 이번에 실행한 범위 통과. FIXED: 수정 후 Production 재검증 완료. FAIL: 관측한 실패. NOT TESTED: 미실행. 앱 수정과 재배포는 없어 FIXED 항목은 없습니다. [이전 보고서](docs/verification/production-2026-10-26/previous-report.md)의 구버전 배포 판정·승인 대기 문구는 현재 상태가 아닙니다.

## 배포

| 항목 | 상태 | 결과 |
|---|---|---|
| Production URL | PASS | https://pack-my-bagproject.vercel.app |
| Vercel | PASS | `dpl_3PRBzF2jBW5CcbcJ8T9LG1ewwA4E`, READY, target `production` |
| 고유 배포 URL | PASS | https://pack-my-bagproject-kvq65i2j9-princesong.vercel.app |
| 배포 생성 | PASS | 2026-10-26 00:38:36 KST |
| 배포 커밋 | PASS | `8ca7250ae35d1dd99247052a1a3afe25d4e693c0` |
| 최신 GitHub와 일치 | PASS | `Princesongg/pack-my-bag_project` main의 git ls-remote SHA와 Vercel gitSource.sha 일치 |
| Preview 구분 | PASS | Vercel API target=production으로 확인. 브랜치 alias만으로 판단하지 않음 |
| 빌드 자산 일치 | PASS | 재빌드 후 모든 dist/assets 청크의 공개 응답과 SHA256 일치 |
| 직접 링크 | PASS | `/`, `/planning`, `/implementation`, `/implementation/workspace`, `?view=bag`, `/implementation/travel-info` 모두 HTTP 200 |
| 새로고침 | PASS | MY BAG, LAST MINUTE BAG 실제 reload 및 상태 복원 |

근거: [배포 정보](docs/verification/production-2026-10-26/deployment.json), [HTTP](docs/verification/production-2026-10-26/http.json), [새 자산 검사](docs/verification/production-2026-10-26/assets.json). HTTP 스크립트의 resources 일부는 과거 관측 URL의 재요청이므로 이번 브라우저 로드 판정은 새 UI 기록과 assets.json으로 확인했습니다.

## 반응형

Windows의 실제 headless Chrome을 CDP로 제어했습니다. Mobile은 viewport 에뮬레이션이며 실기기가 아닙니다. 기본 높이 900px, 모달 리사이즈 추가 검사 높이 600px.

| 구분 | 너비 | 상태 | 실행 범위 |
|---|---|---|---|
| PC | 1920, 1440, 1280 | PASS | 전체 흐름, MY BAG 카드, 모달, 완료 애니메이션 |
| Tablet | 1024, 820, 768 | PASS | 전체 흐름, 카드 정렬, 모달, 완료 애니메이션 |
| Mobile 에뮬레이션 | 430, 390, 375, 360 | PASS | 전체 흐름, 아코디언, 모달, 완료 애니메이션 |
| 전환 경계 | 640, 641 및 추가 중간 너비 | PASS | 체크리스트 전환·체크 유지, 모달 열린 상태 축소 |

- UI 166개 기록: 페이지/모달 가로 넘침 0, 검사 대상 버튼 44px 미만·가로 이탈 0, Console Error 0, 실행 예외 0, 수집한 HTTP 응답 중 4xx/5xx 0.
- 체크리스트 12개 너비 × 초기/복원 24개 기록: PC 2열 카드 폭·높이, 기타 준비물 전체 폭·하단 빈 공간, 모바일 기본/추가 펼침, 긴 영문 물품명, 44px 이상 label/삭제 버튼, 체크/해제·진행률·새로고침 복원 통과.
- 390→1440→390 및 중간 너비 변경에서도 체크 유지·가로 넘침 없음.
- PC/모바일 체크리스트, 모바일 모달 및 완료 캡처를 직접 열어 카드 간격·줄바꿈·모서리 표시를 확인했습니다. 모든 화면의 미세한 여백과 모든 스크롤 위치의 radius 시각 전수검사는 NOT TESTED입니다.

근거: [전체 UI 기록](docs/verification/production-ui/2026-10-26/ui-results.json), [체크리스트](docs/verification/production-2026-10-26/checklist/after.json), [PC 카드](docs/verification/production-2026-10-26/checklist/cards-1440-initial.png), [모바일 아코디언](docs/verification/production-2026-10-26/checklist/cards-390-restored.png).

## LAST MINUTE BAG

**PASS — 요청된 10개 너비에서 일반 모션을 실제 실행했습니다.** MY BAG 진입 버튼→확인 모달→마지막 점검→마지막 항목 체크까지 수행했습니다. 집중 검사에서는 여행 초기값을 QA localStorage로 준비했고, 입력 화면부터의 경로는 별도 전체 흐름 검사에서 수행했습니다.

| 항목 | 상태 | 관측 |
|---|---|---|
| 단계 순서 | PASS | checking→folding→flying→complete 전 단계 관측 |
| 체크리스트 사라짐/비행기 이동 | PASS | 합계 1,106개 requestAnimationFrame 샘플 및 너비별 단계 PNG |
| 잘림·역방향 튐 | PASS | 관측한 비행 프레임에서 비행기 경계가 카드 내부, x 역행 없음 |
| 가로 스크롤 | PASS | 수집한 전체 프레임에서 없음 |
| 완료 문구/빈 화면 | PASS | 모든 너비에서 ALL SET. / ENJOY YOUR TRIP! 확인 및 캡처 |
| 중복 실행 | PASS | 실행별 pmb-final-takeoff animationstart 1회 |
| 새로고침/재진입 | PASS | 완료 상태 복원, flying 재실행 없음 |
| reduced-motion | PASS | 별도 전체 흐름에서 reduce 설정으로 완료 화면 도달 |
| 실기기·녹화·FPS | NOT TESTED | Chrome 에뮬레이션·단계 캡처·좌표 기록만 수행 |

근거: [프레임 기록](docs/verification/production-2026-10-26/animation/results.json), [PC 이동 중](docs/verification/production-2026-10-26/animation/1440-flying-2.png), [모바일 완료](docs/verification/production-2026-10-26/animation/390-complete.png). 같은 폴더에 10개 너비의 folding/flying/complete 캡처가 있습니다. 좌표 샘플은 정량적 FPS 또는 모든 프레임의 시각적 부드러움 판정을 대신하지 않습니다.

## 기능·오류

| 항목 | 상태 | 실행 결과 |
|---|---|---|
| START→TRIP INPUT→MY BAG→요약/BRIEF→RED FLAGS→CHECKLIST→PACK LESS→LAST MINUTE | PASS | 실제 Production 10개 너비 흐름 완료 |
| 6개국 연결 | PASS | 일본·베트남·태국·대만·미국·호주 대표 도시, 1440/390px 12개 여정·180개 화면 |
| 국가/도시·날짜 선택 | PASS | 입력/선택 후 여행 생성, 국가 변경 시 도시 해제·날짜 유지 |
| 체크/해제·물품 추가/삭제 | PASS | 긴 영문명 포함, 체크 반영·진행률·복원·삭제 |
| PACK LESS | PASS | 질문→제안→제외 적용→물품 복원 |
| 여권·비자 중복 회귀 | PASS | 6개국×1440/390/320px 18건, US/AU 배너 및 여권 입력 분리 |
| 모달 | PASS | 날씨·전압·수하물·전자기기·RED FLAGS·최종 확인·비자 열기/닫기, Tab/Escape/포커스 복귀 |
| localStorage | PASS | reload·새 탭 복원, 손상 JSON 안전 복구 |
| 여권 만료일 임시 입력 | PASS | localStorage/sessionStorage 미저장 |
| 뒤로/앞으로 | PASS | 입력/MY BAG 이동 및 복원 |
| Console/JS/React 오류 | PASS | 이번 UI·6개국 실행의 Console Error·실행 예외 0 |
| 자체 JS/CSS/SVG | PASS | 새 자산 검사 14개 모두 HTTP 200·빌드 일치 |
| 공식 출처 HTTP 접근 | FAIL | 128개 중 122개 2xx/3xx, 6개 접근 실패 |
| 실제 터치·좌표 hit-test 전수검사 | NOT TESTED | 주된 조작은 DOM click/입력. 크기 검사는 수행했지만 터치 차단을 완전히 배제하지 못함 |

근거: [6개국](docs/verification/production-2026-10-26/countries.json), [저장 검사](docs/verification/production-2026-10-26/storage.json), [여권/비자](docs/verification/production-2026-10-26/visa/results.json), [외부 링크](docs/verification/production-2026-10-26/links.json).

## 발견한 문제와 미실행 범위

외부 출처 HTTP 접근 실패는 FAIL로 남깁니다. 자동 요청 차단 또는 접속 환경 가능성이 있어 영구적으로 잘못된 URL이라고 단정하지 않습니다. 각 외부 페이지의 브라우저 열기·본문 검증은 NOT TESTED입니다. 검증된 국가 데이터와 출처는 임의로 교체하지 않았습니다.

| URL | 관측 | 범위 |
|---|---|---|
| tourismthailand.org/Articles/plan-your-trip-electricity | 403 | Production 표시 링크 |
| taiwantour.or.kr/introduction/faq.html | 403 | Production 표시 링크 |
| travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html | 403 | Production 표시 링크 |
| tourismthailand.org/Articles/plan-your-trip-customs-and-immigration | 403 | Production 표시 링크 |
| fam.state.gov/FAM/09FAM/09FAM040309.html | fetch failed | Production 표시 링크 |
| molit.go.kr/USR/NEWS/dtl.jsp?id=95091874&lcmspage=3 | fetch failed | 로컬 출처 목록, 이번 화면 수집 링크는 아님 |

추가 NOT TESTED: 실제 Android/iOS, Safari/Firefox/Edge, OS 브라우저 프로세스 완전 종료 후 복원, 국가 데이터·여권/비자 규정의 최신 원문 재감사, 모든 국가의 모든 도시/날짜 조합, 모든 화면 높이/가로모드, Network.loadingFailed 이벤트 전수 수집. 데이터 연결 PASS는 여행 규정 정확성 재인증이 아닙니다.

## 변경 및 재배포

- 앱 소스·Figma 디자인·국가 데이터·저장 키/스키마 수정 없음. 신규 기능·유료 API·서버·DB 추가 없음. QA 전용 Chrome 프로필 사용.
- `scripts/verify_checklist_final.mjs`, `scripts/verify_visa_separation_ui.mjs`: QA_ORIGIN/QA_OUTPUT 옵션 추가, 기존 기본 로컬 동작 유지.
- `scripts/verify_production_assets.mjs`: 새 Production 자산 및 빌드 전체 청크의 HTTP/해시 검사 추가.
- 이 보고서와 연결된 JSON/PNG 증거 갱신. TypeScript/Vite `npm.cmd run build` PASS.
- 첫 샌드박스 실행은 네트워크·상위 폴더 접근 제한으로 중단됐으나 허용된 재실행에서 공개 URL 검사와 빌드가 통과했습니다. 앱 오류로 집계하지 않았습니다.
- 앱 수정이 없어 재배포하지 않았습니다. 수정 후 재배포 검증은 NOT TESTED입니다. 현재 기존 Production을 직접 검사한 결과만 보고합니다.
- 로컬 폴더에는 `.git`이 없어 QA 산출물 commit/push를 수행하지 않았습니다. 배포 최신 여부는 원격 Git과 Vercel에서 별도 확인했습니다.
