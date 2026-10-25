export const redFlagGroups = [
  { id: 'passport', title: 'PASSPORT CHECK', name: '여권 준비', items: [
    { id: 'passport:expiry', label: '여권 유효기간을 확인했어요.' },
    { id: 'passport:trip-end', label: '여행 종료일까지 여권이 유효한지 확인했어요.' },
    { id: 'passport:country', label: '국가별 필요한 잔여 유효기간을 공식 안내에서 확인했어요.' },
    { id: 'passport:name', label: '항공권 영문 이름과 여권 이름이 일치하는지 확인했어요.' },
    { id: 'passport:damage', label: '여권에 훼손이 없는지 확인했어요.' },
    { id: 'passport:entry-authorization', label: '내 여행의 비자·무비자·전자여행허가 조건을 직접 확인했어요.' },
    { id: 'passport:entry-procedure', label: '입국신고 방법과 제출 시점 등 출발 전 절차를 확인했어요.' },
  ] },
  { id: 'payment', title: 'PAYMENT CHECK', name: '해외 결제 준비', items: [
    { id: 'payment:expiry', label: '카드 유효기간이 여행 기간까지 유효한지 확인했어요.' },
    { id: 'payment:international', label: '해외 사용이 가능한 카드인지 확인했어요.' },
    { id: 'payment:block', label: '카드사 앱에서 해외 이용 차단 설정을 확인했어요.' },
    { id: 'payment:limit', label: '카드 결제 한도와 이용 가능한 금액을 확인했어요.' },
    { id: 'payment:backup', label: '예비 결제 수단을 준비했어요.' },
  ] },
  { id: 'baggage', title: 'BAGGAGE CHECK', name: '항공 반입 준비', items: [
    { id: 'baggage:power-bank', label: '보조배터리 반입·사용·충전 조건을 확인했어요.' },
    { id: 'baggage:liquids', label: '액체류·젤류의 용기와 포장 조건을 확인했어요.' },
    { id: 'baggage:electronics', label: '전자기기 배터리의 장착·분리 조건을 확인했어요.' },
    { id: 'baggage:limits', label: '기내·위탁 제한 및 이용 항공사의 추가 조건을 확인했어요.' },
    { id: 'baggage:free-allowance', label: '항공권에 표시된 무료 위탁수하물 허용량을 확인했나요? (확인했어요)' },
  ] },
] as const;
export type RedFlagGroup = typeof redFlagGroups[number]['id'];
const checkIds = new Set<string>(redFlagGroups.flatMap(group => group.items.map(item => item.id)));
export function restoreRedFlagChecks(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : []).filter((id): id is string => typeof id === 'string' && checkIds.has(id)))];
}
export function redFlagProgress(ids: readonly string[]) {
  const checked = new Set(ids);
  return redFlagGroups.map(group => ({ id: group.id, complete: group.items.every(item => checked.has(item.id)), checked: group.items.filter(item => checked.has(item.id)).length, total: group.items.length }));
}
