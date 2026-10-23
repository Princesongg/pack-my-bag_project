import { climateArchive } from './climate.generated';
import type { Source } from './types';
import { internationalSources } from './international';

export const researchCheckedOn = '2026-10-23';
export const referenceSources: Source[] = [
  { id: 'jma-download', organization: '일본 기상청', title: '과거 관측자료 다운로드', url: 'https://www.data.jma.go.jp/risk/obsdl/index.php', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '공식 다운로드 진입점. 실제 수집은 동일 기관의 월별 관측 HTML 표를 사용했다.' },
  { id: 'jma-quality', organization: '일본 기상청', title: '값과 품질 기호 설명', url: 'https://www.data.jma.go.jp/stats/data/mdrr/man/remark.html', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'jma-tokyo-relocation', organization: '일본 기상청', title: '2015 기상업무 백서: 도쿄 관측지 변경', url: 'https://www.jma.go.jp/jma/kishou/books/hakusho/2015/01-1.html', period: { startYear: 2014, endYear: 2014 }, status: 'verified', lastVerified: researchCheckedOn, notes: '2014-12-02 오테마치에서 기타노마루 공원으로 변경. 수집 기간 이전 사건이며 전체 관측 이력 검토 완료를 뜻하지 않는다.' },
  { id: 'jnto-electricity', organization: '일본정부관광국 JNTO', title: 'Plugs & Electricity', url: 'https://www.japan.travel/en/plan/plug-and-electricity/', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'jnto-faq', organization: '일본정부관광국 JNTO', title: 'FAQ: 전압, Type A, JPY', url: 'https://www.japan.travel/en/faq/', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'jnto-plan', organization: '일본정부관광국 JNTO', title: 'Planning: 시간대, 서머타임, 두 평행 평핀', url: 'https://www.japan.travel/en/plan/', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'nict-jst', organization: '일본 정보통신연구기구 NICT', title: 'Japan Standard Time', url: 'https://www.nict.go.jp/en/sts/jst.html', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'kma-kst', organization: '대한민국 기상청', title: '기상데이터 FAQ: KST=UTC+9', url: 'https://bd.kma.go.kr/contest/faq_view.do', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'japan-visa-busan', organization: '주부산일본국총영사관', title: '사증(VISA) 신청 안내', url: 'https://www.busan.kr.emb-japan.go.jp/itpr_ko/nsm_021.html', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '페이지 표시 갱신일 2026-09-01. 한국 일반여권 단기체재 90일 이내 기본 조건.' },
  { id: 'digital-agency-vjw', organization: '일본 디지털청', title: 'Visit Japan Web 서비스 설명', url: 'https://www.digital.go.jp/policies/visit_japan_web', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'vjw-ko-guide', organization: '일본 디지털청', title: 'Visit Japan Web 한국어 이용 가이드', url: 'https://services.digital.go.jp/ko/visit-japan-web/guide/', period: null, status: 'needs-research', lastVerified: null, notes: '요청된 공식 링크. 도구에서 본문을 추출하지 못해 세부 절차·필수 여부는 확인 처리하지 않았다. 서비스 기능은 digital-agency-vjw에서 별도 확인.' },
  { id: 'japan-customs', organization: '일본 재무성 세관', title: 'Passenger: Customs Declaration', url: 'https://www.customs.go.jp/english/passenger/', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'sapporo-season', organization: '삿포로시', title: '삿포로시 개요, 기후: PDF 3쪽', url: 'https://www.city.sapporo.jp/shimin/bunkazai/documents/2sixyou.pdf', period: { startYear: 1981, endYear: 2010 }, status: 'verified', lastVerified: researchCheckedOn, notes: '겨울의 추위·많은 눈이라는 정성적 특징만 사용한다. 이 문서의 1981–2010 수치는 현재 기후 데이터에 혼합하지 않는다.' },
  { id: 'icn-restricted-items', organization: '인천국제공항공사', title: '제한물품 안내', url: 'https://www.airport.kr/ap_ko/905/subview.do', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '액체류·도검류 예외·보조배터리 본문 확인. 항공사별 허용 크기와 무게는 검증 대상이 아니다.' },
  { id: 'molit-power-banks-2026', organization: '국토교통부', title: '보조배터리 2개 제한, 기내 사용·충전 전면 금지 (2026-04-08)', url: 'https://www.molit.go.kr/USR/NEWS/dtl.jsp?id=95091874&lcmspage=3', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '공식 보도자료 원문과 정책브리핑의 동일 부처 발표 대조. 시행일 2026-04-20.' },
  { id: 'molit-power-banks-2026-policy', organization: '국토교통부 · 정책브리핑', title: '보조배터리 여객기 반입, 20일부터 1인당 2개까지만 허용', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148962298', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'icn-battery-faq', organization: '인천국제공항공사', title: '배터리 반입 FAQ (작성 2024-12-06)', url: 'https://www.airport.kr/ap_ko/907/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXBfa28lMkY5NDYlMkYxMzg0MjclMkZhcnRjbFZpZXcuZG8lM0Y%3D', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '배터리 종류·장착 여부만 활용. 보조배터리 개수는 2026년 보도자료를 우선한다.' },
  { id: 'icn-spray-faq', organization: '인천국제공항공사', title: '스프레이 반입 FAQ', url: 'https://www.airport.kr/ap_ko/907/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXBfa28lMkY5NDYlMkYxMzg0MjglMkZhcnRjbFZpZXcuZG8lM0Y%3D', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'icn-restricted-faq', organization: '인천국제공항공사', title: '제한물품 FAQ · 전자담배와 전자기기', url: 'https://www.airport.kr/ap_ko/907/subview.do', period: null, status: 'verified', lastVerified: researchCheckedOn },
  { id: 'molit-electronics-guide', organization: '대한민국 정책브리핑', title: '리튬 배터리·스마트가방 항공기 반입 안내 (2018)', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148847990', period: null, status: 'verified', lastVerified: researchCheckedOn, notes: '장착·분리 구분을 공항 현행 FAQ와 대조. 과거 보조배터리 수량 안내는 사용하지 않는다.' },
];

export const sources: readonly Source[] = [...referenceSources, ...internationalSources, ...climateArchive.sources];
export function getSource(id: string) { return sources.find(source => source.id === id); }
