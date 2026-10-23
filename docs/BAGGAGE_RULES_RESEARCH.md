# BAGGAGE GUIDE 공식 규정 확인

실제 확인일: **2026-10-23**. 런타임 API 없이 `src/service/data/baggageRules.ts`와 출처 레지스트리로 제공한다. STEP 04-1 보고서의 수하물 미조사 상태를 이번 범위에서 갱신했다. ‘확인 완료’는 기록된 기본 조건의 검증이며, 모든 제품·항공사에 대한 반입 허가를 의미하지 않는다.

## 직접 확인한 공식 출처

- [인천국제공항 제한물품](https://www.airport.kr/ap_ko/905/subview.do): 국제선 액체류·지퍼백, 면세 보안봉투, 도검류와 객실 예외, 보조배터리 위탁 금지·용량·승인 조건.
- [국토교통부 2026-04-08 보도자료](https://www.molit.go.kr/USR/NEWS/dtl.jsp?id=95091874&lcmspage=3): 웹 조회 도구에서는 리디렉션 오류가 발생했으나 HTTP 요청으로 공식 페이지와 아래 HWPX 첨부 원문을 직접 열어 본문을 대조했다.
  - 원문 첨부: `https://www.molit.go.kr/portal/common/download/DownloadMltm2.jsp?FilePath=/upload/portal/DextUpload/202604/20260407_140318_619.hwpx&FileName=release.hwpx`
  - [동일 부처 정책브리핑](https://www.korea.kr/news/policyNewsView.do?newsId=148962298)에서도 확인했다.
  - 2026-04-20 시행, 보조배터리 1인 최대 2개·각 160Wh 이하, 100Wh 초과 시 항공사 승인, 보조배터리 자체 충전 및 다른 기기 충전 모두 금지. 과거 100Wh 이하 5개 안내는 사용하지 않는다. mAh는 전압에 따라 달라지므로 고정 환산하지 않는다.
- [공항 배터리 FAQ](https://www.airport.kr/ap_ko/907/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXBfa28lMkY5NDYlMkYxMzg0MjclMkZhcnRjbFZpZXcuZG8lM0Y%3D): 알칼라인·리튬·습식 구분, 장착 리튬배터리 160Wh 이하. 작성일은 2024-12-06이며 보조배터리 개수는 2026년 발표를 우선한다.
- [공항 스프레이 FAQ](https://www.airport.kr/ap_ko/907/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXBfa28lMkY5NDYlMkYxMzg0MjglMkZhcnRjbFZpZXcuZG8lM0Y%3D): 개인위생용 객실 액체류 조건, 위탁 합계 2kg(2L)·종류당 500mL 이하 1개, 호신용 객실 금지·위탁 100mL 이하 1개/인, 인화성 살충제 객실·위탁 모두 금지.
- [공항 제한물품 FAQ](https://www.airport.kr/ap_ko/907/subview.do): 전자담배 객실 휴대만 가능.
- [정책브리핑 전자기기 안내(2018)](https://www.korea.kr/news/policyNewsView.do?newsId=148847990): 장착·분리 구분만 공항 FAQ와 함께 활용. 과거 보조배터리 수량은 인용하지 않는다.

## 예외와 판정 범위

- 액체류는 남은 양이 아닌 용기 용량 기준. 면세 STEB는 밀봉 유지 조건의 예외이며 환승 조건을 별도 확인한다.
- 날카로운 물건의 객실 제한과 둥근 버터칼·안전날 면도기·안전면도기·전기면도기 예외를 함께 표시한다. 기내식 칼 예외는 항공사 소유품에 한한다.
- 스프레이는 용도별로 구분하며 모든 제품에 같은 허용량을 적용하지 않는다.
- 전자기기의 장착 배터리와 분리한 여분 리튬배터리, 전자담배를 구분한다. 160Wh 이하라는 사실만으로 위탁 허용을 단정하지 않는다.

## 미확인 유지 항목

항공사·운임별 수하물 크기/무게/개수/요금, 유아식·의료 목적 액체 예외 증빙, 개별 가위·공구 치수, 리튬메탈 함량·장착 배터리 포장과 전원 차단 세부 조건, 여분 배터리 개수, 보조배터리 단락 방지·보관 절차, 산업용·성분 불명 스프레이 예외는 이번에 검증하지 않았다. 이 내용은 ‘세부 규정 확인 필요’로 표시하며 수치나 허용 판정을 생성하지 않는다.
