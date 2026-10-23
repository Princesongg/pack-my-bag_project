import type { BagItem } from './bag';

export type PackLessAnswers = { accommodationAmenities: 'yes' | 'no' | 'unknown' | ''; laundryPlan: 'yes' | 'no' | ''; shoppingPlan: 'yes' | 'no' | '' };
export type PackingDecision = { action: 'keep' | 'reduce' | 'exclude'; quantity?: number };
export type PackingDecisions = Record<string, PackingDecision>;
export type PackLessSnapshot = { answers: PackLessAnswers; decisions: PackingDecisions };
export type PackLessState = PackLessSnapshot & { previous?: PackLessSnapshot };
export type PackingSuggestion = { item: BagItem; group: 'keep' | 'review' | 'reduce'; reason: string; protected: boolean };
export const emptyPackLessAnswers: PackLessAnswers = { accommodationAmenities: '', laundryPlan: '', shoppingPlan: '' };
export function isProtectedItem(item: BagItem) {
  return item.categoryId === 'essentials' || item.id === 'other:medicine' || /여권|약|처방|입국|비자|의료|passport|medicin|medicat|visa|prescription/i.test(item.name.replace(/치약/g, ''));
}
export function answersComplete(answers: PackLessAnswers) {
  return Boolean(answers.accommodationAmenities && answers.laundryPlan && answers.shoppingPlan);
}
export function getPackingSuggestions(items: readonly BagItem[], answers: PackLessAnswers, tripDays: number | null): PackingSuggestion[] {
  const normalized = (name: string) => name.replace(/\s+/g, '').toLocaleLowerCase();
  return items.map(item => {
    const protectedItem = isProtectedItem(item);
    if (protectedItem) return { item, group: 'keep', protected: true, reason: '여권·입국 준비·필요한 의약품 등 중요한 준비물은 유지하세요. 개인에게 필요한 서류와 의약품은 직접 확인해 주세요.' };
    if (item.categoryId === 'toiletries') return { item, group: answers.accommodationAmenities === 'no' ? 'keep' : 'review', protected: false, reason: answers.accommodationAmenities === 'yes' ? '숙소에서 제공된다고 답하셨어요. 샴푸·바디워시·칫솔 등 실제 제공 품목을 숙소에 확인한 뒤, 이 항목이 모두 제공될 때만 제외를 검토하세요.' : answers.accommodationAmenities === 'no' ? '숙소에서 제공하지 않는다고 답하셨어요. 직접 사용할 세면용품을 준비하세요.' : '숙소의 제공 품목이 확인되지 않았어요. 숙소 안내에서 필요한 품목별 제공 여부를 확인한 뒤 결정하세요.' };
    if (items.some(other => other.id !== item.id && normalized(other.name) === normalized(item.name))) return { item, group: 'reduce', protected: false, reason: '같은 이름의 물품이 목록에 있어요. 용도가 같은 중복 물품인지 직접 확인한 뒤 하나를 제외할 수 있어요.' };
    const clothing = item.categoryId === 'clothing' && !['clothing:walking-shoes', 'clothing:rain-protection', 'clothing:cold-weather-accessories'].includes(item.id);
    if (clothing && answers.laundryPlan === 'yes' && tripDays !== null && tripDays > 1) return { item, group: 'reduce', protected: false, reason: `${tripDays}일 여행 중 세탁할 계획이라고 답하셨어요. 세탁일·건조 시간·갈아입을 횟수를 확인한 뒤 여벌 수량을 직접 정해 보세요. 정해진 세탁일이 없어 수량을 자동으로 줄이지 않습니다.` };
    return { item, group: 'keep', protected: false, reason: '입력한 조건만으로 줄일 근거가 충분하지 않아요. 필요한 용도와 실제 사용 계획을 확인하며 유지하세요.' };
  });
}
export function sanitizeDecisions(value: unknown, items: readonly BagItem[]): PackingDecisions {
  const decisions: PackingDecisions = {};
  if (!value || typeof value !== 'object') return decisions;
  for (const item of items) {
    const raw = Object.prototype.hasOwnProperty.call(value, item.id) ? (value as Record<string, unknown>)[item.id] : null;
    if (!raw || typeof raw !== 'object') continue;
    const decision = raw as Record<string, unknown>;
    if (decision.action === 'keep') decisions[item.id] = { action: 'keep' };
    else if (!isProtectedItem(item) && decision.action === 'exclude') decisions[item.id] = { action: 'exclude' };
    else if (!isProtectedItem(item) && decision.action === 'reduce' && Number.isInteger(decision.quantity) && Number(decision.quantity) >= 1 && Number(decision.quantity) <= 999) decisions[item.id] = { action: 'reduce', quantity: Number(decision.quantity) };
  }
  return decisions;
}
export function restorePackLess(value: unknown, items: readonly BagItem[]): PackLessState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  function snapshot(value: unknown): PackLessSnapshot {
    const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
    const a = (raw.answers && typeof raw.answers === 'object' ? raw.answers : {}) as Record<string, unknown>;
    return { answers: {
      accommodationAmenities: ['yes', 'no', 'unknown'].includes(String(a.accommodationAmenities)) ? a.accommodationAmenities as PackLessAnswers['accommodationAmenities'] : '',
      laundryPlan: ['yes', 'no'].includes(String(a.laundryPlan)) ? a.laundryPlan as PackLessAnswers['laundryPlan'] : '',
      shoppingPlan: ['yes', 'no'].includes(String(a.shoppingPlan)) ? a.shoppingPlan as PackLessAnswers['shoppingPlan'] : '',
    }, decisions: sanitizeDecisions(raw.decisions, items) };
  }
  return { ...snapshot(raw), ...(raw.previous && typeof raw.previous === 'object' ? { previous: snapshot(raw.previous) } : {}) };
}
export function visibleBagItems(items: readonly BagItem[], decisions: PackingDecisions = {}) {
  return items.filter(item => isProtectedItem(item) || decisions[item.id]?.action !== 'exclude');
}
