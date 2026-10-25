# PACK MY BAG — Production QA

점검일: 2026-10-25 (Asia/Seoul). **전체 Production 통과 아님. 현재 공개 버전과 최신 로컬 코드가 다릅니다.** 공개 서비스에 존재하는 기본 흐름은 실행했으나, 최근 데이터·규정·반응형 개선의 상당 부분이 배포되지 않았습니다. 재배포는 승인 검토에서 차단되어 수행하지 않았습니다.

## 상태 정의

- PASS: 실제 공개 Production에서 실행한 해당 검사 통과.
- FAIL: 실제 Production의 문제 또는 요구된 최신 기능 미반영 확인.
- FIXED: 재배포 후 Production에서 수정 검증 통과. **이번 작업에는 해당 없음.**
- LOCAL FIX ONLY: 로컬 수정·빌드에는 있지만 Production에 반영되지 않음.
- NOT TESTED: 실행하지 않음. 로컬 테스트·원문 검토를 Production PASS로 대신하지 않음.

## A. 실제 배포 정보

| 항목 | 확인 결과 |
|---|---|
| Production URL | https://pack-my-bagproject.vercel.app |
| 호스팅 | 기존 Vercel `princesong/pack-my-bag_project` |
| 현재 Deployment | `dpl_3Humt6BLsjBrb3JXUDBMe6egVyeP`, Ready, target `production` |
| 불변 배포 주소 | https://pack-my-bagproject-cddmt8rai-princesong.vercel.app |
| 배포 생성 | 2026-10-23 18:05:58 KST |
| 배포 출처 | GitHub `Princesongg/pack-my-bag_project`, branch `main` |
| 배포 커밋 | `31c4ef8c0ae01c3d98a5365ad9347ce3701c5013` |
| 현재 로컬 Git | 저장소가 아니므로 로컬 branch/commit 및 push 상태 확인 불가 |
| Production JS | `/assets/index-CIPtQz9J.js`, SHA256 `51baadb4b669f529f7190246bb25e4fe171f1d85bf86a31fb412566e79ab32b0` |
| 로컬 최신 JS | `/assets/index-Cc-EpF-n.js`, 현재 Production과 다름 |

Vercel CLI의 `ls --prod`, `inspect --json`, 읽기 전용 배포 API로 환경·Git 출처를 확인했습니다. Git branch 별칭을 Production 판단 근거로 대신하지 않았습니다. 이후 브라우저 테스트는 위 공개 Production 별칭에서 실행했습니다.

## B. 핵심 발견 사항

| ID | 심각도 | Production에서 확인한 문제 | 현재 상태 |
|---|---|---|---|
| PROD-01 | P0 | 항공 요약에 `1인 최대 2개 · 각 160Wh 이하 · 위탁 불가`가 남아 있음. 최근 로컬의 항공사 승인·용량 차이를 구분한 안내와 배지 통일이 미반영 | FAIL / LOCAL FIX ONLY |
| PROD-02 | P1 | 다낭·방콕·타이베이에서 날씨가 ‘자료 확인 필요’, 전압이 ‘세부 정보 확인 필요’. 나트랑도 같은 문제를 별도 확인. 로컬 정적 데이터가 배포에 없음 | FAIL / LOCAL FIX ONLY |
| PROD-03 | P1 | 미국·호주 전압 상세에도 JNTO 출처가 표시됨 | FAIL / LOCAL FIX ONLY |
| PROD-04 | P1 | 미국 ESTA·호주 ETA 최신 안내 배너와 국가별 여권 규정 개선이 미반영. 기존 여권 날짜 입력 자체는 존재하지만 최신 국가별 판정 검증을 통과했다고 볼 수 없음 | FAIL / LOCAL FIX ONLY |
| PROD-05 | P2 | 현지 시각 영역이 기존 공개 요약에 없음. DST·시간대 관련 최신 기능을 Production에서 시험할 수 없음 | FAIL / LOCAL FIX ONLY |
| PROD-06 | P2 | 모바일 선택 완료 후에도 국가6개·도시 카드가 계속 표시됨. 최근 요약/변경 UI 없음 | FAIL / LOCAL FIX ONLY |
| PROD-07 | P2 | 모달을 연 채 창을 줄이면 배경 요소가 이전 너비로 남는 현상 재현 | FAIL / LOCAL FIX ONLY |

P0는 이번에 새 규정을 추정한 판정이 아니라, 사용자가 요청하여 이미 수정한 용량·승인 조건 구분이 공개 버전에 빠져 있다는 안전 우선순위입니다. 공식 규정의 최신 원문 전체를 이번 QA에서 다시 검증한 것은 아닙니다.

정상 코드를 재구현하지 않았습니다. 위 문제는 이전 로컬 수정에 이미 반영되어 있어 이번 작업에서 앱 `src` 파일을 추가 수정하지 않았습니다. 공개 URL에서는 여전히 미해결이며 FIXED로 표시하지 않습니다.

## C. 실제 기능 검사

| 항목 | 결과 | 실제 범위 |
|---|---|---|
| HTTPS / HSTS | PASS | HTTPS 접속, HSTS `max-age=63072000; includeSubDomains; preload` |
| SPA 직접 URL | PASS | `/`, `/planning`, `/implementation`, `/implementation/workspace`, `?view=bag`, `/implementation/travel-info` 모두 HTTP200 |
| JS·CSS·SVG | PASS | 브라우저에서 관측한13개 리소스 별도 GET 성공. 앱 요청의404/500 및 Console Error/런타임 예외0 |
| START→입력→MY BAG→상세→최종 완료 | PASS | 6개국 대표 도시×1440/390px,12회 기존 흐름 실행. 각 국가의 최신 데이터 정확성까지 PASS라는 뜻은 아님 |
| 국가·도시·검색·날짜·목적·수하물 | PASS | 기존 카드 선택, 입력 및 MY BAG 생성. 최신 모바일 요약은 FAIL |
| 날짜/여행 기간 | PASS | 2026-12-17~12-20과 별도2027-12-17~12-20 입력,3박4일 표시·날짜 복원 |
| 여행 요약·통화 | PASS | 6개국의 실제 선택 결과 캡처. 시각·DST는 최신 기능 미반영으로 NOT TESTED |
| 카드·상세 열기/닫기 | PASS | 현재 배포에 있는 날씨·전압·항공·전자기기·RED FLAGS 상세. 내용/출처 오류는 별도 FAIL |
| 여권 만료일 개인정보 | PASS | 기존 입력에2030-11-23 임시 입력 후 localStorage/sessionStorage에 값이 없는 것 확인 |
| 최신6개국 여권 판정 | NOT TESTED | 현재 공개 UI가 최신 로컬 구현과 다름. 통과로 간주하지 않음 |
| 체크·사용자 물품 추가/삭제 | PASS | 개인 노트 추가·체크·리로드 복원·삭제 |
| PACK LESS | PASS | 질문 입력→칫솔 제외 적용→제외 목록에서 복원 |
| LAST MINUTE BAG | PASS | 항목 완료→리스트 전환·비행기/완료 화면. 이번 Production 주 검사에서는 reduced-motion 사용, 모든 정상 모션 프레임 성능은 NOT TESTED |
| 새로고침·새 탭 재접속 | PASS | 전용 프로필에서 기존 탭 종료/새 탭 접속 후 체크 상태 복원. 전체 브라우저 프로세스 종료 후 복원은 이번에 NOT TESTED |
| 브라우저 뒤로/앞으로 | PASS | MY BAG↔입력 화면 history 이동 및 복귀 |
| 여행 변경·손상 저장값 | PASS | 국가 변경 시 이전 도시 해제·날짜 유지. 손상된 trip JSON은 빈 입력으로 복구 |
| 키보드 | PASS | RED FLAGS 모달 Tab 순환·Escape 닫기·트리거 포커스 복귀 |
| 정부 승인 조회 | NOT TESTED | 조회하지 않음. 기존 RED FLAGS의 사용자 확인은 정부 승인으로 표시하지 않음 |

6개국: 도쿄·다낭·방콕·타이베이·뉴욕·시드니. 기존 Production의12월 요약에서 도쿄8.1°C/뉴욕3.9°C/시드니21.9°C를 관측했지만, 이 수치를 최신 공식 통계 재검증 결과로 취급하지 않습니다. VN/TH/TW 누락은 실제 FAIL입니다.

검사 코드는 최신 로컬에만 존재하는 `data-topic`·상세 클래스 등과 구 배포의 차이 때문에 초기 중단됐습니다. 공개 버전의 실제 카드 인덱스·기존 모달 구조를 사용하도록 테스트를 수정하고 처음부터 재실행했습니다. 그 중단을 사이트 클릭 장애로 오인하지 않았습니다.

## D. 반응형 및 브라우저

- Chrome 실제 Production 검사:1920/1440/1280/1024/820/768/430/390/375/360px.15장면×10너비 + 열린 모달16단계 축소 =166개 기록.
- 6개국 추가 검사:15장면×6국×1440/390px =180개 기록.
- Edge 실제 Production 검사:1440/390px,46개 기록(모달16단계 포함).
- 기본 페이지/모달 가로 스크롤 및 앱 리소스 오류는 없었음. 모달 열린 상태에서 배경 가로 이탈은 FAIL로 분리.
- 모바일390px 일본·도쿄 선택 완료: 페이지 높이1,494px, 국가6개·도시4개 카드 그대로 노출, 요약 행0개. 최신 로컬의 요약 UI가 배포됐다는 주장은 하지 않음.
- 대표 캡처를 직접 검토: Production1920px 나트랑 MY BAG,390px 미국 MY BAG. 모바일에서 ESTA 배너가 없는 것과 기존 데이터/배지 문구를 확인.
- Safari / 모바일 Safari / Android 실기기 Chrome: NOT TESTED. Windows Chrome/Edge의 모바일 viewport는 실기기 브라우저 검사와 다름.

일반 flow 스크립트의 `PASS before ... full journey` 로그는 기존 흐름을 끝까지 실행했다는 뜻입니다. `before`는 기록용 모드이며, 데이터·최신 기능·전체 디자인의 합격 점수가 아닙니다. JSON의 실제 이탈·미반영 항목을 이 보고서에서 FAIL로 기록했습니다.

## E. 성능·접근성·보안

실제 공개 사이트의 Chrome PerformanceObserver와 Navigation/Resource Timing을 사용했습니다. Lighthouse는 설치/실행하지 않았으며 점수를 만들지 않았습니다.

| 측정 | 실제 값·한계 |
|---|---|
| START의 관측 LCP | 10너비에서80~368ms |
| START의 관측 CLS | 해당 짧은 기록 구간에서0 |
| TTFB | 약18.7~213.8ms |
| 초기 JS | 292,499bytes, 압축 전 응답 본문 크기 |
| 초기 CSS | 33,479bytes, 압축 전 |
| Workspace 청크 | JS65,571bytes / CSS38,322bytes |
| MobileCompact 청크 | JS285,493bytes / CSS26,359bytes |
| SVG7개 | 국기6개+favicon, 모두200 |

동일 브라우저 반복 접속·캐시가 포함되고 CPU/네트워크 throttling 없는 단일 실행의 짧은 관측값입니다. 실제 사용자 p75·모바일 저속 환경·최종 세션 LCP/CLS를 대표하지 않습니다. INP·CrUX 현장 데이터·Lighthouse 점수·애니메이션 FPS는 NOT TESTED입니다. 이 수치만으로 성능 개선이 필요 없다고 확정하지 않았습니다.

Console Error/런타임 예외0, 수집된 앱 HTTP 오류0. 키보드 모달 조작은 실제 실행했습니다. 전체 색상 대비 전수 검사·스크린리더 음성·모든 버튼/링크 터치 영역의 인증은 NOT TESTED입니다.

공개 리소스13개와 로컬 dist에서 대표 키 패턴(private key/OpenAI/AWS/GitHub token)을 검사해 발견0건. 완전한 보안 감사는 아니며 실제 비밀값을 출력하거나 Production 환경변수를 취득하지 않았습니다. 앱 코드에 `import.meta.env`/`process.env` 참조는 없고 정적 서비스로 실행됩니다.

## F. 공식 링크

실제 Production에서 수집한 외부 URL32개와 로컬 출처 목록에서만 확인된97개, 합계 고유129개를 GET 검사했습니다. 범위를 `rendered-production`과 `local-source-catalog`로 구분했습니다.122개는2xx/3xx,7개는 접근 실패/거절입니다. `target=_blank` 중 수집된 보안 rel 누락0건.

| 실패 URL/출처 | 관측 | 범위 |
|---|---|---|
| tourismthailand.org/Articles/plan-your-trip-electricity | 403 | 로컬 출처 목록 |
| taiwantour.or.kr/introduction/faq.html | 403 | 로컬 출처 목록 |
| travel.state.gov/.../visa-waiver-program.html | 403 | 로컬 출처 목록 |
| tourismthailand.org/Articles/plan-your-trip-customs-and-immigration | 403 | 로컬 출처 목록 |
| molit.go.kr/USR/NEWS/dtl.jsp?id=95091874&lcmspage=3 | fetch 실패 | Production에서 실제 수집 |
| fam.state.gov/FAM/09FAM/09FAM040309.html | fetch 실패 | 로컬 출처 목록 |
| singapore.embassy.gov.au/sing/visas-faq.html | 12초 timeout | 로컬 출처 목록 |

접근 실패가 링크 영구 삭제를 의미하지 않으므로 임의의 다른 출처로 바꾸지 않았습니다. 링크 HTTP 성공과 법규/통계 본문 검증은 다릅니다.200 응답에도 차단 안내 페이지가 있을 수 있습니다. 미국·호주 JNTO 혼입은 실제 표시 문맥으로 별도 확인했고 LOCAL FIX ONLY 상태입니다. URL별 원문·리다이렉트·상태는 증거 JSON에 있습니다.

## G. 배포 시도·승인 차단·준비 산출물

1. 기존 `vercel.json` SPA rewrite와 Vercel 프로젝트 연결을 유지. 무료 플랜을 바꾸거나 서버/DB/계정을 추가하지 않음.
2. `vercel build --prod --yes`는 자동 승인 검토에서 거절됨. Production 비밀 환경변수를 로컬로 가져올 수 있다는 이유. 실행되지 않았으며 이 취득을 우회하지 않음.
3. 더 안전한 대안으로 승인된 일반 `npm.cmd run build`를 실행. TypeScript와 Vite 빌드 PASS.
4. [Vercel 공식 Build Output 문서](https://vercel.com/docs/build-output-api/configuration)에 맞춰 `.vercel/output/static`에 dist만 준비하고 기존 SPA fallback을 manifest에 기록.17파일/915,268bytes. 소스·문서·`.env`·서버 함수 포함 없음.
5. `vercel deploy --prebuilt --prod --yes`도 자동 승인 검토에서 거절됨. **공개 Production 교체에는 현재 산출물에 대한 사용자의 명시적 승인이 필요하다는 이유.** 실제 업로드·배포·alias 교체는 일어나지 않음. 이후 다른 방식으로 우회하지 않음.

현재 준비된 반영 대상은 이번까지 로컬에서 검증한 기존 기능·국가 데이터·규정·여권/비자 분리·모바일 입력 요약·반응형 수정 전체의 정적 빌드입니다. [산출물 파일/해시 목록](docs/verification/production/pending-static-manifest.json)을 검토할 수 있습니다. Production 환경변수를 다운로드하지 않는 배포 방식입니다.

**남은 승인:** 위 정적 산출물을 기존 `pack-my-bag_project` Production에 반영한 뒤 동일 공개 URL에서 다시 검증해도 되는지 사용자 승인 필요.

로컬 Git 저장소가 없으므로 이 반영을 하더라도 GitHub main이 자동으로 최신 코드가 되는 것은 아닙니다. 향후 기존 Git 연동이 예전 코드를 다시 배포하지 않도록 저장소 동기화는 별도 확인해야 합니다. 이번 작업에서 Git 연동·커밋·운영 설정을 임의로 변경하지 않았습니다.

## H. 변경 파일 및 증거

이번 작업의 앱 소스 수정은 없음. 추가한 파일은 QA 스크립트·보고서·캡처/JSON과 로컬 사전 빌드 산출물입니다.

- `scripts/audit_production_http.mjs`: 공개 경로·자산 해시·리소스·대표 비밀키 패턴.
- `scripts/audit_production_links.mjs`: 실제 화면 링크와 로컬 출처의 HTTP 접근 상태.
- `scripts/verify_production_ui.mjs`: 공개10너비 및 Edge 검사, 실제 브라우저 성능 관측.
- `scripts/verify_production_countries.mjs`:6개국 PC/모바일 실제 흐름.
- `scripts/verify_production_disclosure.mjs`: 현재 배포의 선택 전/후 UI 측정.
- `scripts/verify_production_storage.mjs`: 저장·재접속·삭제·PACK LESS·여권 미저장·키보드·history 검사.
- 이 보고서와 `docs/verification/production*` 증거. `.vercel/output`은 로컬 생성 산출물이며 기존 `.gitignore` 대상.

주요 증거:

- [HTTPS·경로·배포 자산](docs/verification/production/http.json)
- [공식 링크 HTTP 검사](docs/verification/production/links.json)
- [Chrome166개 기록](docs/verification/production-ui/current/ui-results.json)
- [Edge46개 기록](docs/verification/production-ui/edge/ui-results.json)
- [6개국180개 기록](docs/verification/production-countries/current/ui-results.json)
- [저장·키보드·뒤로가기](docs/verification/production-storage/results.json)
- [현재 공개 버전 기능 상태](docs/verification/production-storage/feature-gaps.json)
- [공개 모바일 미국 화면](docs/verification/production-countries/current/US-my-bag-390.png)
- [공개 PC 나트랑 화면](docs/verification/production-ui/current/my-bag-1920.png)

## 최종 판정

기존 공개 서비스의 접속·라우팅·기본 흐름은 동작하지만 **최신 데이터/규정/반응형 변경의 Production QA는 미통과**입니다. LOCAL FIX ONLY를 Production FIXED로 바꾸려면 명시적 배포 승인→기존 프로젝트 반영→새 배포 ID/자산 해시 확인→동일 공개 URL에서 최신 UI·6개국 데이터/규정 재검증이 남아 있습니다. 배포 후 테스트는 NOT TESTED이며, 이미 완료한 것으로 보고하지 않습니다.
