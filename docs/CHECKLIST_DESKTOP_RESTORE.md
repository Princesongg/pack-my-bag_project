# PC 체크리스트 배치 복구

2026-10-25. 앱 수정은 `src/service/my-bag/MyBag.css`의 체크리스트 배치 규칙만입니다. 데이터·추천·체크/저장·아코디언 로직·다른 페이지는 변경하지 않았고 배포하지 않았습니다.

## 근거와 원인

로컬은 Git 저장소가 아니어서 로컬 변경 이력을 조회할 수 없었습니다. 대신 이전 Production의 공개 GitHub 커밋 `31c4ef8c0ae01c3d98a5365ad9347ce3701c5013`에서 실제 `MyBag.css`를 읽어 [원본 사본](verification/checklist-restore/original-commit.css)을 보존했습니다.

- 원본 PC: `repeat(2,minmax(0,1fr))`의2열.
- 현재: `auto-fit`/최소20rem 공통 그리드.1100px 콘텐츠 영역에서3열이 만들어져 첫3개 뒤에 세면 카드가 단독 행으로 밀림.
- `align-items:stretch`가 같은 행의 적은 내용 카드까지 큰 카드 높이로 늘림.
- 기타 준비물의 `grid-column:1 / -1`이 전체 너비를 차지하도록 강제.

원본에도 stretch와 기타 전체 너비 규칙은 있었습니다. 따라서 원본 전체를 그대로 덮지 않고, **기존2열은 복구하면서 이번 사용자 요청에 따라 높이 늘림과 기타 전체 너비 강제를 해제**했습니다.

## CSS 변경

- 공통 카테고리 Grid:2열 `repeat(2,minmax(0,1fr))`, `align-items:start`.
- 기타 카드의 전체 열 span 제거. 내부 목록의 별도2열도 제거하여 다른 카테고리와 같은 일반 카드/목록으로 표시.
-640px 이하에서 명시적1열. 기존 모바일 접기/펼치기·카운터·터치 영역·간격 유지.
- 고정 카드 높이/min-height, 임의 위치 margin, overflow 잘라내기는 추가하지 않음.

## 실제 재검증

Chrome에서1920/1440/1280/1024/820/768/430/390/375/360px 및640/641px,12너비의 변경 전·후를 측정했습니다. 요청한7너비를 모두 포함합니다.

| 측정 | 수정 전 | 수정 후 |
|---|---|---|
|1440/1280px 카드 열 수 |3열 |2열 |
|1440px 일반 카드 너비 |약353px |540px, 기타도 동일 |
|1440px 카드 하단 최대 잔여 공간 |약144.6px |21px(기존20px 패딩+테두리) |
|1024px 최대 하단 잔여 공간 |약59.4px |21px |
|768px 최대 하단 잔여 공간 |약71px |13px(기존12px 패딩+테두리) |
|390px 페이지 전체 높이 |2,996px |2,996px |
|430/360px 페이지 높이 |2,898 /3,043px |동일 |

PC 전체 페이지 높이는2열 복구와 기타 단일 목록으로 약47~49px 늘 수 있습니다. 카드 내부의 강제 빈 공간을 없애는 수정이며, PC 전체 높이를 줄이는 변경으로 과장하지 않습니다.

모든 비모바일 카드가 같은 열 너비를 사용하고 내용 끝 아래에는 정상 패딩만 남는 것을 DOM으로 검사했습니다. 모바일 최초 미완료 카테고리1개 펼침,2개 동시 펼침,접기/펼치기 후 체크 유지,정확한 진행률,리로드 후 저장 내용 동등성,PC↔모바일 전환 체크 보존,긴 개인 물품 추가·자동 펼침·체크·삭제와44px 삭제 버튼을 실행해 통과했습니다. 날씨/전압/항공 모달도 정상 열림·닫힘을 확인했습니다.

TypeScript·Vite 빌드 통과. CSS만 수정했으므로 이번에 전체 모델 테스트나 PACK LESS/LAST MINUTE의 모든 조합을 다시 전수 실행했다고 주장하지 않습니다. 실제 iOS/Android 기기는 미실행입니다.

- [변경 전 측정](verification/checklist-restore/before.json)
- [변경 후 측정](verification/checklist-restore/after.json)
- [PC 체크리스트 캡처](verification/checklist-restore/cards-1440-initial.png) — 직접 검토
- [모바일 체크리스트 캡처](verification/checklist-restore/cards-390-initial.png)

추가 검사 도구: `scripts/read_checklist_history.mjs`(공개 원본 읽기), `scripts/verify_checklist_restore.mjs`(브라우저 재검증). 이번 수정으로 모바일 페이지가 다시 길어지지 않았습니다.
