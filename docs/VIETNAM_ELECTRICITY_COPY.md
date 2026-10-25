# 베트남 전압 팝업 문구 개선

확인일: 2026-10-25

- `electricityGuide.ts`: 베트남 전용 사용 안내와 드라이어 주의 문구를 정의했다. 다른 국가의 데이터와 문구는 유지했다. 충전기와 어댑터는 기존 ID를 유지하며 드라이어·고데기는 자동 추가하지 않는다.
- `ElectricityInfo.tsx` / `.css`: 베트남 호환 안내를 연한 블루, 드라이어 주의를 연한 옐로로 구분했다. 전력 초과·과열·차단기·손상 및 제조사·숙소 확인은 펼침 영역에 정리하고 기존 주의사항의 중복을 제거했다. 준비물은 같은 목록 위치에서 별도 영역으로 제공한다.
- 충전기 배지의 “챙기기”는 행동 안내다. 기존 추천 상태 “확인 후 결정” 및 체크 상태 저장 방식은 그대로다. 입력 사양을 확인한 후 가져갈 제품을 결정한다. 어댑터는 준비 권장, 드라이어·고데기는 확인 후 결정이다.
- 전압·주파수 220V / 50Hz, C/A 일러스트, 출처 URL과 기존 확인일은 그대로 유지했다.

## 출처 재대조

관광청 https://vietnam.travel/node/26/ 에서 220V 및 둥근 2핀 수용 안내를 확인했다. 요청 한국어 URL은 본문 확인이 되지 않아 기존 영문 공식 출처를 유지했다.

ICAO https://www.icao.int/sites/default/files/APAC/Meetings/2026/2026%20AAC-6/General%20Information/Attachment-B-Meeting-Bulletin.pdf 의 6.4 전기 규격과 Panasonic https://panasonic.jp/tourist/en/electricity.html 의 Vietnam 및 South Korea 행을 대조했다. Panasonic은 베트남 220V·50Hz·A/C/F, 한국 220V·60Hz·C/F를 안내한다. 콘센트 모양과 특정 제품의 전기적 호환은 별도로 확인하도록 했다. 제조사 자료는 정부 출처와 구분한다. 개별 제품의 허용 전력이나 50Hz 대응 여부는 국가 자료만으로 확정하지 않는다.

## 검증

- 자동 테스트 76개 통과. 6개국 전체 17개 도시의 준비물 ID·이름·상태·추천 이유 연결과 기존 사용자 체크/제외 상태 복원 검증 포함.
- TypeScript 및 Vite 프로덕션 빌드 통과.
- `scripts/verify_vn_electricity_copy_ui.mjs`: 베트남 4개 도시 × 1440/390/320px = 12개 화면 시나리오 통과. 220V·50Hz, C/A 그림 순서·크기, 안내 문구, 준비물 연결, 중복 방지, 새로고침 체크 유지, 어댑터 제외/복원 및 항공안전 팝업 유지 확인.
- 브라우저 오류, 가로 넘침, 외부 런타임 요청 없음. 결과 및 화면: `docs/verification/vn-electricity-copy/`.

유료 서비스, API, 외부 서버, 저장 형식 변경은 없다.
