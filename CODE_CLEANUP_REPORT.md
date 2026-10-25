# 파일·중복 코드 정리

2026-10-26. Git/Vercel 설정 파일은 변경하지 않았습니다.

- 실제 앱 진입점·동적 import·CSS import·테스트 참조를 조사했습니다. 데이터의 공개 export는 테스트가 사용하므로 유지하고, service.css가 참조하는 typography.css도 유지했습니다.
- 현재 라우트가 통합 입력 화면으로 이동하므로 사용하지 않는 Destination.tsx/.css, TripDetails.tsx/.css, TripProgress.tsx/.css 6개를 제거했습니다. 기존 URL의 redirect는 App.tsx에 그대로 남습니다.
- TripBrief.css의 이전 article형 카드·링크·월별 링크·더 이상 렌더링하지 않는 액체류 안내 스타일을 제거했습니다. 모바일 비교 영역 숨김은 유지했습니다.
- 거의 동일하던 verify_trip_brief_density.mjs와 verify_baggage_footer.mjs를 scripts/helpers/verifyTripBriefLayout.mjs로 공통화했습니다. 포트·프로필·결과 폴더·각 검사의 높이/SVG 검증 차이는 옵션으로 유지합니다. 미사용 import와 변수를 제거했습니다.
- 검증된 여행 데이터·공식 원문·과거 보고서 증거는 삭제하지 않았습니다. 대량 QA 캐시와 node_modules/dist/환경 파일은 커밋 대상이 아닙니다.
- 전체 테스트 94개 및 TypeScript/Vite 빌드 PASS. 실제 Chrome에서 9개 너비×오사카/뉴욕의 카드 높이·링크·모달 회귀 검사 PASS.

원래 작업 폴더에는 .git이 없어 기존 Princesongg/pack-my-bag_project의 main을 node_modules/.cache/cleanup-checkout에 별도로 복제했습니다. 원래 폴더를 git init하지 않고, 기존 원격/설정을 변경하지 않습니다. 로컬의 최근 카드 개선과 QA 파일도 이번 `세부수정` 커밋 대상으로 동기화합니다. 일반 main push만 사용하며 force push는 하지 않습니다. GitHub 연동에 따른 자동 배포가 시작될 수 있지만 Vercel 설정이나 CLI 배포는 변경/실행하지 않습니다.
