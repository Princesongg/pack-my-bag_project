import type { Evidence } from './types';
import { pending, verified } from './types';
import { electronicsGuidance } from './electronicsGuidance';
import { batteryCarryLabels } from './baggageLabels';

export interface BaggageRule {
  id: string; name: string;
  summary?: Evidence<string>;
  details?: Evidence<string[]>;
  unresolved?: string[];
  scope: { departureCountryId: string | null; airlineId: string | null; routeIds: string[]; transitCountryIds: string[]; baggageType: 'cabin' | 'checked' | 'both'; effectiveFrom: string | null; effectiveUntil: string | null };
  cabin: Evidence<'allowed' | 'prohibited' | 'conditional'>;
  checked: Evidence<'allowed' | 'prohibited' | 'conditional'>;
  limits: Evidence<{ unit: 'ml' | 'Wh' | 'kg' | 'count'; maximum: number; conditions: string[] }[]>;
  officialSourceIds: string[]; recheckBeforeDeparture: true;
}

const topics = [
  ['liquids-gels', '국제선 액체류 및 젤류'], ['power-banks', '보조배터리'], ['electronics', '전자기기'],
  ['sharp-objects', '날카로운 물건'], ['aerosols-dangerous-goods', '스프레이 및 위험물'],
  ['cabin-baggage', '기내수하물'], ['checked-baggage', '위탁수하물'],
] as const;
// Start unverified; only the categories researched below are promoted to verified evidence.
export const baggageRules: BaggageRule[] = topics.map(([id, name]) => ({
  id, name,
  scope: { departureCountryId: 'KR', airlineId: null, routeIds: [], transitCountryIds: [], baggageType: 'both', effectiveFrom: null, effectiveUntil: null },
  cabin: pending('품목·노선·환승국·항공사별 최신 규정 추가 조사 필요.'),
  checked: pending('품목·노선·환승국·항공사별 최신 규정 추가 조사 필요.'),
  limits: pending('항공사·운임별 허용 크기·무게·개수는 세부 규정 확인 필요.'),
  officialSourceIds: ['icn-restricted-items'], recheckBeforeDeparture: true,
}));

// These conditional category statuses must be read together with the detailed exceptions.
// Other categories checked 2026-10-23; electronics/power banks rechecked 2026-10-25 below.
// No airline-specific default allowance.
const airport = ['icn-restricted-items'];
function verifyRule(id: string, summary: string, details: string[], unresolved: string[], sourceIds = airport, limits: NonNullable<BaggageRule['limits']['value']> = []) {
  const rule = baggageRules.find(item => item.id === id)!;
  rule.summary = verified(summary, sourceIds);
  rule.details = verified(details, sourceIds);
  rule.unresolved = unresolved;
  rule.cabin = verified('conditional', sourceIds);
  rule.checked = verified(id === 'power-banks' ? 'prohibited' : 'conditional', sourceIds);
  rule.limits = verified(limits, sourceIds);
  rule.officialSourceIds = sourceIds;
}
verifyRule('liquids-gels', '용기당 100mL 이하 · 1인 1L 지퍼백 1개', [
  '한국 출발 국제선 객실: 화장품·세면용품·액상 식품 등은 용기당 100mL 이하로 준비하고, 1인당 1L 투명 재밀봉 지퍼백 1개에 넣어 완전히 닫아야 합니다. 남은 양이 아닌 용기 용량 기준입니다.',
  '위탁: 일반 화장품·세면용품·의약품은 가능하지만 인화성 등 위험물에는 별도 제한이 있습니다. 모든 액체를 무제한 허용한다는 뜻은 아닙니다.',
  '면세 액체류는 보안봉투(STEB)에 밀봉하고 최종 목적지행 탑승 전까지 개봉하지 않는 조건의 예외가 있습니다. 환승 보안검색 조건도 확인하세요.',
], ['유아식·의료 목적 액체류의 예외와 증빙 조건은 세부 규정 확인 필요.'], airport, [
  { unit: 'ml', maximum: 100, conditions: ['객실 개별 용기 용량'] },
  { unit: 'ml', maximum: 1000, conditions: ['1인당 투명 지퍼백 1개', '완전 밀봉'] },
]);
verifyRule('power-banks', `${batteryCarryLabels.cabin} · ${batteryCarryLabels.checked} · 1인 최대 2개 · 용량은 항공사 확인`, [
  ...electronicsGuidance.cards[1].description,
  ...electronicsGuidance.cards[1].additional,
], ['100Wh 초과 제품의 반입을 확정하지 않습니다. 적용 국가·항공사의 최신 용량 제한과 승인 가능 여부를 확인하세요.'], [...electronicsGuidance.sourceIds], [
  { unit: 'count', maximum: 2, conditions: ['1인당 보조배터리', '여분 리튬배터리 전체에 일괄 적용하지 않음', '한국 기준 2026-04-20 시행', 'IATA 2026 안내도 최대 2개'] },
]);
baggageRules.find(rule => rule.id === 'power-banks')!.scope.effectiveFrom = '2026-04-20';
verifyRule('electronics', '노트북·태블릿·게임기 기내 휴대 권장',
  electronicsGuidance.cards.flatMap(card => [...card.description, ...card.additional]),
  [electronicsGuidance.scope], [...electronicsGuidance.sourceIds]);
baggageRules.find(rule => rule.id === 'electronics')!.scope.departureCountryId = null;
for (const rule of baggageRules.filter(rule => ['electronics', 'power-banks'].includes(rule.id))) {
  for (const key of ['summary', 'details', 'cabin', 'checked', 'limits'] as const) {
    const evidence = rule[key];
    if (evidence?.status === 'verified') evidence.lastVerified = electronicsGuidance.checkedOn;
  }
}
verifyRule('sharp-objects', '도검류 등 객실 제한 · 안전면도기 등 예외', [
  '도검류 등 날카로운 물건은 일반적으로 객실 반입이 금지되며 위탁수하물로 운송할 수 있습니다. 품목별 보안검색 기준을 확인하세요.',
  '공식 객실 예외: 둥근 날의 버터칼, 안전날이 포함된 면도기, 안전면도기, 전기면도기. 기내식 전용 칼은 항공사 소유품에 한합니다.',
], ['가위·공구 등의 세부 치수와 개별 제품 판정은 세부 규정 확인 필요.']);
verifyRule('aerosols-dangerous-goods', '개인위생용 조건부 · 인화성 살충제 반입 불가', [
  '개인위생용(헤어스프레이·산소스프레이·몸에 뿌리는 해충기피제): 객실은 용기당 100mL 이하, 1인 1L 투명 지퍼백 1개 기준입니다.',
  '개인위생용 위탁: 합계 2kg(2L) 범위에서 종류당 용기 500mL 이하 1개씩입니다. 용기 용량 기준이며 다른 스프레이에 일괄 적용하지 않습니다.',
  '호신용 스프레이: 객실 불가, 위탁만 1인당 용기 100mL 이하 1개가 가능합니다.',
  '인화성 살충제(에프킬라 등): 객실과 위탁 모두 반입 불가입니다. 제품 용도와 성분을 먼저 확인하세요.',
], ['산업용·성분 불명 스프레이 및 기타 위험물의 예외는 세부 규정 확인 필요.'], ['icn-spray-faq'], [
  { unit: 'ml', maximum: 500, conditions: ['개인위생용 위탁', '종류당 1개', '합계 2kg(2L) 이내'] },
]);
