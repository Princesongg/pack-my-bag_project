import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { getClothingPreview } from '../travel-info/guideModel';
import { restorePackLess, type PackLessState } from './packLessModel';

export const bagCategories = [
  { id: 'essentials', name: '필수 준비물' }, { id: 'clothing', name: '의류 · 패션' },
  { id: 'toiletries', name: '세면 · 위생용품' }, { id: 'electronics', name: '전자기기' },
  { id: 'other', name: '기타 준비물' },
] as const;
export type CategoryId = typeof bagCategories[number]['id'];
export type BagItem = { id: string; name: string; categoryId: CategoryId; custom?: true; note?: string };
export type BagState = { version: 1; checkedIds: string[]; customItems: BagItem[]; packLess?: PackLessState };

// General packing suggestions, not entry requirements or airline clearance.
export const basicBagItems: BagItem[] = [
  { id: 'essential:passport', name: '여권', categoryId: 'essentials' },
  { id: 'essential:booking', name: '항공권 · 숙소 예약 정보', categoryId: 'essentials' },
  { id: 'essential:payment', name: '결제 카드 · 현금', categoryId: 'essentials' },
  { id: 'basic:underwear', name: '속옷 · 양말', categoryId: 'clothing' },
  { id: 'basic:sleepwear', name: '잠옷', categoryId: 'clothing' },
  { id: 'toiletry:toothbrush', name: '칫솔 · 치약', categoryId: 'toiletries' },
  { id: 'toiletry:cleanser', name: '세안 · 샤워용품', categoryId: 'toiletries' },
  { id: 'toiletry:personal', name: '개인 위생용품', categoryId: 'toiletries' },
  { id: 'electronic:phone', name: '휴대전화', categoryId: 'electronics' },
  { id: 'electronic:charger', name: '충전기 · 케이블', categoryId: 'electronics' },
  { id: 'other:medicine', name: '개인 상비약', categoryId: 'other' },
  { id: 'other:bag', name: '보조 가방', categoryId: 'other' },
];

export function bagStorageKey(trip: Trip) {
  return `pack-my-bag.bag.v1:${JSON.stringify([trip.countryId, trip.cityId, trip.departureDate, trip.returnDate, trip.travelPurpose, trip.baggageType])}`;
}
export function getDefaultBagItems(trip: Trip): BagItem[] {
  const items = new Map(basicBagItems.map(item => [item.id, item]));
  for (const segment of getTripClimate(trip.cityId, trip.departureDate, trip.returnDate)) {
    for (const item of getClothingPreview(segment.climate, trip.travelPurpose)) {
      items.set(item.checklistItemId, { id: item.checklistItemId, name: item.name, categoryId: 'clothing', note: 'PACK MY BAG 옷차림 참고 항목 · 개인차와 출발 전 예보를 확인하세요.' });
    }
  }
  return [...items.values()];
}
export function restoreBag(value: unknown, defaults: readonly BagItem[]): BagState {
  const empty: BagState = { version: 1, checkedIds: [], customItems: [] };
  if (!value || typeof value !== 'object') return empty;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return empty;
  const ids = new Set(defaults.map(item => item.id));
  const customItems: BagItem[] = [];
  for (const item of Array.isArray(raw.customItems) ? raw.customItems : []) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.startsWith('custom:') || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.trim().length > 60 || !bagCategories.some(category => category.id === item.categoryId)) continue;
    ids.add(item.id);
    customItems.push({ id: item.id, name: item.name.trim(), categoryId: item.categoryId, custom: true });
  }
  const packLess = restorePackLess(raw.packLess, [...defaults, ...customItems]);
  return { version: 1, customItems, checkedIds: [...new Set((Array.isArray(raw.checkedIds) ? raw.checkedIds : []).filter((id): id is string => typeof id === 'string' && ids.has(id)))], ...(packLess ? { packLess } : {}) };
}
export function loadBag(storage: Pick<Storage, 'getItem'>, key: string, defaults: readonly BagItem[]) {
  try { return restoreBag(JSON.parse(storage.getItem(key) ?? 'null'), defaults); }
  catch { return restoreBag(null, defaults); }
}
export function packingProgress(items: readonly BagItem[], checkedIds: readonly string[]) {
  const checked = new Set(checkedIds);
  const complete = items.filter(item => checked.has(item.id)).length;
  return { total: items.length, complete, percent: items.length ? Math.round(complete / items.length * 100) : 0 };
}
