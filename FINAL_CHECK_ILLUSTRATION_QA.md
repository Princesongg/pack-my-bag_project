# FINAL CHECK 여행 일러스트

2026-10-27. 기존 왼쪽 제목·설명·상태 안내·CTA 동작과 버튼 폭을 유지하고 오른쪽 장식 SVG를 추가했습니다.

- 닫힌 버터 옐로 캐리어가 중심이며, 왼쪽 뒤 보딩패스는 -13도, 오른쪽 뒤 여권은 +12도 기울여 겹쳤습니다. 오른쪽 위 작은 비행기·짧은 점선 궤적·주변 반짝임 3개를 배치했습니다.
- 기존 블루/아이보리/옐로 계열, 둥근 모서리, 플랫 면과 선만 사용했습니다. 별도 배경 박스·외부 이미지·API·추가 정보 카드는 없습니다.
- PC는 2열 Grid, 왼쪽 기존 CTA의 480px 폭을 우선 확보하고 오른쪽 SVG만 가용 영역에서 비율을 유지해 축소합니다. SVG는 해당 Grid 영역 안에서 absolute 배치하여 행 높이를 늘리지 않습니다.
- 768px 이하에서는 일러스트를 숨겨 기존 요약 높이와 버튼 우선순위를 유지합니다. 장식 래퍼는 aria-hidden, SVG는 focusable=false, pointer-events:none으로 처리했습니다.

## 검증

Chrome 및 Windows WebKit에서 1920/1440/1280/1024/820/768/430/390/375/360/320px, 합계 22개 조합을 검사했습니다.

- PASS: 섹션 제목/설명/상태/버튼 문구 유지. 기존 1열 CSS를 검사 중 임시 적용해 전후 높이·버튼 폭 비교.
- PASS: PC/태블릿에서 섹션 약266px로 높이 증가 없음, CTA 폭480px 유지. 모바일은 기존 높이와 동일, 그림 숨김.
- PASS: 텍스트/버튼과 그림 겹침 없음, 가로 overflow 없음, CTA→기존 확인 모달→LAST MINUTE BAG 진입 성공.
- PASS: 수집한 JS 예외·console.error 0, TypeScript/Vite 빌드 성공.
- NOT TESTED: 실제 iOS/Android 기기, Safari OS UI, Production 재배포 후 화면. 이번에는 commit/push/배포하지 않았습니다.

변경: `FinalCheckIllustration.tsx` 추가, `FinalCheckCTA.tsx` 장식 연결, `FinalCheckCTA.css` 전용 반응형 배치, `scripts/verify_final_check_illustration.mjs` 검사 도구, 이 기록과 검증 PNG/JSON. 앞선 iOS 폼 변경과는 별개이며 이번에 다른 기능·여행 데이터·체크리스트는 수정하지 않았습니다.

근거: [검사 결과](docs/verification/final-check-illustration/results.json), [PC](docs/verification/final-check-illustration/chrome-1440.png), [태블릿](docs/verification/final-check-illustration/chrome-820.png), [모바일](docs/verification/final-check-illustration/chrome-390.png).
