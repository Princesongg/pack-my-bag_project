# 체크리스트 행별 높이 및 기타 카드

2026-10-25. 이번 요청에 따라 기존2열에서 각 행의 높이를 맞추고 기타 준비물을 낮은 가로형 카드로 정리했습니다. 앱 수정은 `src/service/my-bag/MyBag.css`뿐입니다.

- `align-items:stretch`로 같은 행 안에서만 더 많은 콘텐츠의 자연 높이를 공유. `grid-auto-rows:1fr`, 고정 height/min-height, row-span은 사용하지 않음.
- 기타 카드는 `grid-column:1 / -1`, 내부 목록은 `repeat(2,minmax(0,1fr))`. 항목이 늘면 다음 행으로 배치되어 자연스럽게 높이 증가.
-640px 이하에서는 외부·기타 내부 모두1열. 기존 아코디언 접기/펼치기·데이터·체크 상태·저장 로직 유지.

실제 Chrome 검사:1920/1440/1280/1024/820/768/430/390/375/360/640/641px. 같은 행 높이·일반 카드 동일 너비·기타 전체 너비·정상 하단 패딩·가로 넘침을 검사했습니다. 모바일 여러 카테고리 펼침·체크 유지·진행률·리로드 저장 복원·화면 전환·긴 사용자 물품 추가/삭제와 상세 모달도 통과했습니다. TypeScript/Vite 빌드 통과. 데이터/기능/다른 페이지 수정 및 배포 없음.

1440px 실측:첫 행 카드 각각376.8px,둘째 행 각각268.2px,기타 카드131.8px. 기타 내부 하단 잔여 공간21px은 기존20px 패딩+테두리입니다. 전체 카드 높이를 같은 값으로 강제하지 않았습니다.

430/390/360px 페이지 높이는 각각2,898/2,996/3,043px로 수정 전과 동일합니다. 실제 모바일 기기 검사는 미실행이며 Chrome viewport 검사입니다.

- [변경 전 측정](verification/checklist-row-grid/before.json)
- [변경 후 측정](verification/checklist-row-grid/after.json)
- [1440px 실제 캡처](verification/checklist-row-grid/cards-1440-initial.png) — 직접 확인
- 브라우저 재검증: `scripts/verify_checklist_rows.mjs`

이 문서는 앞선 `CHECKLIST_DESKTOP_RESTORE.md`의 개별 카드 높이/기타 반폭 선택을 이번 행별 정렬·기타 가로형 요구로 갱신하는 후속 기록입니다.
