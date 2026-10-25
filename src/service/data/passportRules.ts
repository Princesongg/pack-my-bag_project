import type { Source } from './types';

const checked = '2026-10-25';
const source = (id: string, organization: string, title: string, url: string, notes: string): Source => ({ id, organization, title, url, notes, status: 'verified', lastVerified: checked, period: null });
export const passportSources: Source[] = [
  source('passport-jp', '주대한민국 일본국대사관', '여권 잔여 유효기간 FAQ', 'https://www.kr.emb-japan.go.jp/itpr_ko/consulate.html', '입출국 시 유효한 여권 필요. 별도 최소 잔여기간 없음.'),
  source('passport-vn-list', '베트남 외교부 · 주알제리 대사관', '한국 국적자 일반 무비자 적용 범위', 'https://vnembassy-algiers.mofa.gov.vn/en/tin-chi-tiet/chi-tiet/nghi-quyet-44nq-cp-59226-1377.html', '정부 결의44/NQ-CP 본문 재확인. 한국 포함 2025-03-15~2028-03-14,45일. 기존 본부 링크 연결 불안정으로 같은 정부의 대사관 본문 사용.'),
  source('passport-vn-law', '베트남 정부 관보', '외국인 출입국법 · 제20조 1(a)', 'https://congbaocdn.chinhphu.vn/180507251028987904/2026/4/10/469192-1775620625_v1_1775783105_signed.pdf', '2026-04-10 통합 법령 PDF 18쪽. 단독 무비자 입국자의 여권 잔여기간 최소 6개월. 비자 입국·푸꾸옥 특별면제에 자동 확대하지 않음.'),
  source('passport-th', '태국관광청 TAT', 'Customs & Immigration · 여권 유효기간', 'https://www.tourismthailand.org/Articles/plan-your-trip-customs-and-immigration', '도착 시 최소 6개월 유효한 여권. 같은 페이지의 체류 허용일수는 이번 판정에 사용하지 않음.'),
  source('passport-tw', '대만 외교부 영사사무국 BOCA', 'Visa-Exempt Entry · Requirements', 'https://www.boca.gov.tw/fp-149-4486-7785a-1.html', '2026-07-17 게시 본문 한국90일 및 입국일 기준6개월 재확인. 미국·일본 국적 예외를 한국 여권에 적용하지 않음.'),
  source('passport-us-fam', '미국 국무부', '9 FAM 403.9-3(B) · 한국 여권 추가 6개월 면제', 'https://fam.state.gov/FAM/09FAM/09FAM040309.html', '공식 HTML 직접 조회. 2025-03-26 개정 (B)(2) 목록의 South Korea와 (B)(1) 예외·(B)(2)의 만료일까지 인정 조건 확인. CBP 검색 본문의 체류기간 유효 조건과 대조.'),
  { id: 'passport-us-cbp', organization: '미국 CBP', title: 'Technical Requirements for Passports · 본문 재확인 필요', url: 'https://www.help.cbp.gov/s/article/Article-1238?language=en_US', period: null, status: 'needs-research', lastVerified: null, notes: '검색에는 체류기간 유효·추가 6개월 면제 문구가 있으나 직접 열면 CSS 오류. 단독 확정 근거로 사용하지 않음.' },
  source('passport-au', '주싱가포르 호주 고등판무관실', 'Passport validity FAQ', 'https://singapore.embassy.gov.au/sing/visas-faq.html', '호주는 별도 6개월 요구 없음. 입출국 유효 여권 및 체류 중 만료 방지, 항공사·다른 국가 조건 별도 확인.'),
];

export interface PassportRule {
  name: string; method: 'entry-six-months' | 'through-stay'; requirement: string;
  sourceIds: string[]; relatedSourceIds?: string[]; extra: string;
  validFrom?: string; validThrough?: string; maximumStayDays?: number;
}
export const passportRules: Record<string, PassportRule> = {
  JP: { name: '일본', method: 'through-stay', requirement: '일본은 별도 6개월 최소 요건이 없어요. 예정 체류기간 동안 유효한 여권이 필요해요.', sourceIds: ['passport-jp'], extra: '무비자 체류 범위와 항공사·경유지 조건도 확인하세요.' },
  VN: { name: '베트남', method: 'entry-six-months', requirement: '베트남의 한국 여권 일반 무비자 입국은 입국일 기준 6개월 이상 유효한 여권이 필요해요.', sourceIds: ['passport-vn-list', 'passport-vn-law'], extra: '일반 무비자 기준이에요. 비자 입국이나 푸꾸옥 특별면제는 별도 확인하세요.', validFrom: '2025-03-15', validThrough: '2028-03-14', maximumStayDays: 45 },
  TH: { name: '태국', method: 'entry-six-months', requirement: '태국은 입국일 기준 여권 유효기간이 6개월 이상 필요해요.', sourceIds: ['passport-th'], extra: '실제 체류 허용기간과 입국 서류는 태국 공식 안내에서 별도로 확인하세요.' },
  TW: { name: '대만', method: 'entry-six-months', requirement: '대만은 한국 일반여권 무비자 입국 시 입국일 기준 6개월 이상 필요해요.', sourceIds: ['passport-tw'], extra: '다른 국적의 여권 유효기간 예외는 한국 여권에 적용되지 않아요.' },
  US: { name: '미국', method: 'through-stay', requirement: '한국 여권은 미국의 추가 6개월 유효기간 요건 면제 대상이에요. 예정 체류기간 동안 유효해야 해요.', sourceIds: ['passport-us-fam'], relatedSourceIds: ['passport-us-cbp'], extra: 'ESTA 등 입국허가와 무비자 입국 자격은 별도로 확인하세요.' },
  AU: { name: '호주', method: 'through-stay', requirement: '호주는 일반적으로 예정 체류기간 동안 유효한 여권이 필요해요. 별도 6개월 요건은 없어요.', sourceIds: ['passport-au'], extra: '항공사와 경유 국가의 추가 요건을 확인하세요. ETA 등 비자·입국허가는 별도예요.' },
};

export function getPassportRule(countryId: string) {
  return Object.prototype.hasOwnProperty.call(passportRules, countryId) ? passportRules[countryId] : null;
}
