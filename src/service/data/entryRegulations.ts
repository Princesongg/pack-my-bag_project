import { recalculateTrip, type Trip } from '../trip/trip';
import type { Source } from './types';

const checkedOn = '2026-10-25';
const evidence = (id: string, organization: string, title: string, url: string, notes: string): Source => ({ id, organization, title, url, notes, period: null, status: 'verified', lastVerified: checkedOn });
export const entryRegulationSources: Source[] = [
  evidence('entry-jp-short', '일본 외무성', '한국 국적 단기체류 비자면제', 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html', '한국 목록 및 기본90일 확인. 페이지 갱신2025-09-01은 규정 최초 시행일이 아님.'),
  evidence('entry-vn-exemption', '베트남 외교부 · 주알제리 대사관', '결의44/NQ-CP · 한국 포함45일', 'https://vnembassy-algiers.mofa.gov.vn/en/tin-chi-tiet/chi-tiet/nghi-quyet-44nq-cp-59226-1377.html', '2025-03-15~2028-03-14 적용, 한국 포함45일. 기존 본부 페이지 연결 불안정 대신 같은 정부의 결의 안내 본문 확인.'),
  evidence('entry-vn-pai', '베트남 공안부', 'PAI 시범사업 · 선택 절차', 'https://en.mps.gov.vn/article/immigration-department-launches-pre-arrival-information-system-1778670404', '2026-05-13 발표. 2026-04-15 탄손누트공항 시범 개시, optional 명시. 전국 의무화·다른 공항 적용 완료를 확인한 자료가 아님.'),
  evidence('entry-th-seoul', '주한 태국대사관', 'Visa Exemption Scheme · 안내 차이 재확인', 'https://seoul.thaiembassy.org/en/publicservice/visa-exemption-scheme?cate=5fa4b5e3c34b8f749474d312', '페이지2025-12-30 갱신본은 한국60일을 설명. 2026-09-15 개편 및 협정 별도 적용과 함께 봐야 하므로 현재 한국 체류일수 확정 근거로 단독 사용하지 않음.'),
  evidence('entry-th-revision', '태국관광청 TAT', '2026-09-15 비자면제 개편·협정 별도', 'https://www.tatnews.org/2026/09/thailand-introduces-new-30-day-and-15-day-visa-exemption-rules-from-15-september/', '30/15일 일반 개편 및90/30/14일 협정 별도 적용 안내. 한국을 일반30일 대상이라고 추정하지 않음. 한국 적용기간은 대사관 추가 확인.'),
  evidence('entry-th-tdac', '태국 이민국', 'TDAC 공식 FAQ', 'https://tdac.immigration.go.th/manual/en/faq.html', '입국일 포함3일 이내 제출, 출입국심사 없는 환승·승무원 예외. 비자와 별도. 상세 최초 시행일은 별도 발표에서 확인해야 함.'),
  evidence('entry-tw-twac', '대만 내정부 이민서', 'TWAC 제출 기간7일로 확대', 'https://www.immigration.gov.tw/5382/5385/7229/7238/415735', '2026-07-15 발표·즉일 확대. 기존3일 안내·구 매뉴얼 대신7일 사용. 온라인 전환은2025-10-01.'),
  evidence('entry-us-vwp-current', '미국 국무부', 'Visa Waiver Program · 한국·90일·ESTA', 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html', '한국 대상,90일 관광,전자여권/ESTA,승인 비보장. 방문이력·복수국적 등 자격 예외는 공식 본문을 확인하도록 안내.'),
  evidence('entry-au-ipc', '호주 국경수비대 ABF', 'Incoming Passenger Card', 'https://www.abf.gov.au/entering-and-leaving-australia/crossing-the-border/at-the-border/incoming-passenger-card-(ipc)', '입국자 신고서·세관/검역 절차와 대상 확인. ETA와 별개.'),
  evidence('entry-au-atd', '호주 국경수비대 ABF', 'ATD 시범·전국 확대 계획', 'https://www.abf.gov.au/newsroom-subsite/Pages/Australia-Travel-Declaration-to-be-rolled-out-nationwide.aspx', '2026-07-13 발표. 일부Qantas편 시범,2027년말 전국도입 계획. 계획을 현재 전면 시행이라고 표시하지 않음.'),
];

export type EntryRegulation = {
  visa: string; stay: string; arrival: string; notes: string[]; sourceIds: string[];
  links: { label: string; url: string }[];
  dates: { subject: string; effectiveFrom: string | null; effectiveThrough?: string; publishedOn?: string; note?: string }[];
  unresolved: string[]; maximumDays?: number; countFromNextDay?: boolean;
};
export const entryRegulations: Record<string, EntryRegulation> = {
  JP: {
    visa: '한국 일반여권의 단기 관광은 비자면제 대상이에요. 취업·장기체류 등은 적합한 비자를 별도로 확인하세요.', stay: '단기체류 기본 허용기간은 최대90일이에요. 실제 입국 시 허가된 체류기간을 확인하세요.', maximumDays:90,
    arrival: '입국심사·세관신고 준비에 Visit Japan Web을 이용할 수 있어요. 비자나 입국 허가를 대신하지 않으며 모든 여행자에게 온라인 이용이 필수라고 단정하지 않아요.',
    notes:['예정 체류기간 동안 유효한 여권을 준비하고 입국신고·세관신고 방법을 공식 안내에서 확인하세요.'],
    sourceIds:['entry-jp-short','passport-jp','digital-agency-vjw'], links:[{label:'일본 외무성 · 단기체류 비자면제',url:'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html'},{label:'Visit Japan Web · 공식 안내',url:'https://services.digital.go.jp/ko/visit-japan-web/guide/'}],
    dates:[{subject:'단기체류 비자면제',effectiveFrom:null,publishedOn:'2025-09-01',note:'공식 페이지 갱신일. 최초 시행일은 이번 자료에서 확인하지 못했어요.'}], unresolved:[],
  },
  VN: {
    visa:'한국 일반여권의 일반 비자면제는 입국 조건을 충족하면 최대45일이에요. 장기체류·면제 대상 밖은 비자 또는 전자비자 자격을 확인하세요.',stay:'일반 비자면제 최대45일. 푸꾸옥 특별면제를 일반 규정과 혼합하지 않아요.',maximumDays:45,
    arrival:'공안부의 2026-05-13 발표는 탄손누트공항 PAI를 선택적 시범 절차로 설명해요. 전국 의무 입국신고라고 안내하지 않으며 실제 입국 공항의 최신 적용 여부를 확인하세요.',
    notes:['여권 잔여기간6개월은 일반 단독 비자면제 조건이에요. 전자비자·푸꾸옥 특별면제는 별도 조건을 확인하세요.','PAI는 비자 신청이 아니에요. 공식 전자비자는 evisa.gov.vn 안내를 이용하세요.'],
    sourceIds:['entry-vn-exemption','passport-vn-law','entry-vn-pai'],links:[{label:'베트남 정부 · 비자면제 결의 안내',url:'https://vnembassy-algiers.mofa.gov.vn/en/tin-chi-tiet/chi-tiet/nghi-quyet-44nq-cp-59226-1377.html'},{label:'공안부 · PAI 적용 범위 확인',url:'https://en.mps.gov.vn/article/immigration-department-launches-pre-arrival-information-system-1778670404'},{label:'공식 전자비자 안내',url:'https://evisa.gov.vn/'}],
    dates:[{subject:'일반 비자면제',effectiveFrom:'2025-03-15',effectiveThrough:'2028-03-14',publishedOn:'2025-03-07'},{subject:'PAI 선택적 시범',effectiveFrom:'2026-04-15',publishedOn:'2026-05-13',note:'탄손누트공항 시범 발표 기준. 전국 적용 완료는 미확인.'}],unresolved:['실제 입국 공항과 경유 조건을 모르므로 PAI의 최신 적용 여부는 추가 확인이 필요해요.'],
  },
  TH: {
    visa:'한국 여권에 대한 비자면제 제도가 있지만, 최신 일반면제·양자협정의 적용 조건을 주한 태국대사관에 확인하세요.',stay:'공식 자료의 일반면제 개편과 한국 여권 관련 기존 안내가 달라 이번에는 체류일수를 확정하지 않아요.',
    arrival:'입국심사를 받는 관광객은 TDAC을 입국일 포함3일 이내에 제출하세요. TDAC은 비자가 아니에요. 입국심사 없는 환승과 승무원 등은 예외가 있어요.',
    notes:['숙소·출국 항공권과 체류 조건을 확인하세요. 한국 여권을 일반30일 대상이나 모든 경우90일 허용으로 단정하지 않아요.'],sourceIds:['passport-th','entry-th-seoul','entry-th-revision','entry-th-tdac'],
    links:[{label:'주한 태국대사관 · 한국 여권 조건 확인',url:'https://seoul.thaiembassy.org/en/publicservice/visa-exemption-scheme?cate=5fa4b5e3c34b8f749474d312'},{label:'공식 TDAC 제출',url:'https://tdac.immigration.go.th/'},{label:'태국 이민국 · TDAC 대상·예외',url:'https://tdac.immigration.go.th/manual/en/faq.html'}],
    dates:[{subject:'일반 비자면제 개편',effectiveFrom:'2026-09-15',note:'한국 여권의 협정 적용기간까지 확정한 날짜가 아니에요.'},{subject:'TDAC',effectiveFrom:null,note:'제출 시점과 대상은 확인. 최초 시행일은 이번 FAQ에서 확인하지 못했어요.'}],unresolved:['한국 여권의 최신 적용 체류기간은 대사관 추가 확인이 필요해요.'],
  },
  TW: {
    visa:'한국 일반여권은 입국 조건을 충족하면 관광 비자면제 대상이에요. 장기체류·다른 목적은 적합한 비자를 확인하세요.',stay:'입국 다음날부터 최대90일. 출국편 예약과 다음 목적지 입국 조건도 확인하세요.',maximumDays:90,countFromNextDay:true,
    arrival:'해당 외국인 관광객은 입국심사 전에 TWAC을 온라인으로 제출하세요. 2026-07-15부터 도착 전7일 이내에 작성할 수 있어요.',
    notes:['여권 잔여기간은 입국일 기준6개월 이상이에요. 미국·일본 국적의 예외를 한국 여권에 적용하지 않아요.','TWAC은 비자·여행허가가 아닌 입국신고예요. 거류증 소지 등 예외는 이민서 공식 안내에서 확인하세요.'],sourceIds:['passport-tw','entry-tw-twac'],
    links:[{label:'대만 BOCA · 비자면제 조건',url:'https://www.boca.gov.tw/fp-149-4486-7785a-1.html'},{label:'공식 TWAC 제출',url:'https://twac.immigration.gov.tw/'},{label:'이민서 · TWAC7일 확대 안내',url:'https://www.immigration.gov.tw/5382/5385/7229/7238/415735'}],
    dates:[{subject:'TWAC 온라인 전환',effectiveFrom:'2025-10-01'},{subject:'TWAC 작성기간7일 확대',effectiveFrom:'2026-07-15',publishedOn:'2026-07-15'},{subject:'비자면제 조건',effectiveFrom:null,publishedOn:'2026-07-17',note:'게시일을 최초 시행일로 취급하지 않아요.'}],unresolved:[],
  },
  US: {
    visa:'ESTA는 비자가 아닌 전자여행허가예요. 한국 전자여권의 관광 VWP 자격에 맞으면 출발 전 승인을 확인하세요. 방문이력·복수국적 등으로 별도 비자가 필요할 수 있어요.',stay:'VWP 관광은 최대90일. 유효 비자로 여행한다면 해당 비자·입국 허가 조건을 따로 확인하세요.',maximumDays:90,
    arrival:'ESTA와 입국심사는 별개예요. 미국 입국 시 세관신고·체류기록(I-94) 등 필요한 절차는 CBP와 이용 항공사의 안내를 확인하세요.',
    notes:['유효한 미국 비자를 그 목적에 맞게 사용한다면 ESTA가 필요하지 않을 수 있어요.','신청 수수료·최신 자격·반환 항공권 등의 조건은 공식 안내에서 직접 확인하세요.'],sourceIds:['entry-us-vwp-current','entry-us-esta','entry-us-esta-definition','passport-us-fam'],
    links:[{label:'공식 ESTA 신청 · 승인 상태 확인',url:'https://esta.cbp.dhs.gov/'},{label:'미국 국무부 · VWP 자격·예외',url:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html'}], dates:[{subject:'VWP·ESTA',effectiveFrom:null,note:'현재 공식 안내와 대조. 최초 시행일은 이번에 확정하지 않았어요.'}],unresolved:[],
  },
  AU: {
    visa:'호주는 ETA(subclass601) 등 적합한 비자가 필요해요. ETA는 미국 ESTA와 달리 비자예요. 유효한 다른 호주 비자가 있다면 본인의 조건을 확인하세요.',stay:'한국 여권 관광객의 ETA 신청 안내는 방문당 최대3개월 범위예요. 실제 비자 허가서의 체류 조건을 확인하세요.',
    arrival:'입국신고(IPC)와 세관·검역 신고를 준비하세요. ATD는 일부 항공편의 디지털 대체 시범으로, 모든 여행자에게 온라인 신고가 전면 시행됐다고 안내하지 않아요.',
    notes:['Australian ETA App 신청과 본인의 비자 승인 결과를 직접 확인하세요. 앱 다운로드와 신청 서비스 수수료는 별개예요.','ATD는 2027년말 전국 확대 계획이 발표된 상태예요. 항공편별 최신 신고 방법을 출발 전에 확인하세요.'],sourceIds:['entry-au-eta-korea','entry-au-eta-601','passport-au','entry-au-ipc','entry-au-atd'],
    links:[{label:'호주 내무부 · ETA(subclass601)',url:'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601'},{label:'주한 호주대사관 · ETA App 안내',url:'https://southkorea.embassy.gov.au/seol/ETA601.html'},{label:'ABF · 입국신고서 안내',url:'https://www.abf.gov.au/entering-and-leaving-australia/crossing-the-border/at-the-border/incoming-passenger-card-(ipc)'}],
    dates:[{subject:'ETA 한국 여권 신청',effectiveFrom:null,note:'대사관 본문 확인. 최초 시행일은 이번에 확정하지 않았어요.'},{subject:'ATD 확대 계획',effectiveFrom:null,publishedOn:'2026-07-13',note:'2027년말 전국 확대 계획. 현재 전면 시행일이 아니에요.'}],unresolved:['ATD 적용은 항공편별로 달라요. ETA의 개별 자격·비자 조건과 함께 공식 안내에서 확인하세요.'],
  },
};
export function getEntryRegulation(trip: Trip) {
  if(!Object.prototype.hasOwnProperty.call(entryRegulations,trip.countryId)) return null;
  const entry=entryRegulations[trip.countryId],stay=recalculateTrip(trip).tripDays;
  const days=entry.countFromNextDay && stay!==null ? stay-1:stay;
  const outOfScope=trip.travelPurpose==='business'||days===null||(entry.maximumDays!==undefined&&days>entry.maximumDays)||
    (trip.countryId==='VN'&&(trip.departureDate<'2025-03-15'||trip.departureDate>'2028-03-14'));
  return {...entry,checkedOn,outOfScope,days,needsReview:outOfScope||entry.unresolved.length>0};
}
