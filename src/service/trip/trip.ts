import { loadSelection, validateSelection } from '../destination/destinations';

export const tripKey = 'pack-my-bag.trip.v1';
export const purposes = [
  { id: 'sightseeing', label: '관광 · 맛집 · 쇼핑', icon: 'compass' },
  { id: 'relaxation', label: '휴양 · 리조트', icon: 'sun' },
  { id: 'adventure', label: '액티비티 · 야외 활동', icon: 'mountain' },
  { id: 'business', label: '출장 · 업무', icon: 'briefcase' },
] as const;
export const baggageOptions = [
  { id: 'cabin-only', label: '기내수하물만 이용', icon: 'backpack' },
  { id: 'checked', label: '위탁수하물 포함', icon: 'luggage' },
] as const;
export type Trip = {
  countryId: string; cityId: string; departureDate: string; returnDate: string;
  tripDays: number | null; tripNights: number | null;
  travelPurpose: string; baggageType: string;
};
export const emptyTrip: Trip = { countryId: '', cityId: '', departureDate: '', returnDate: '', tripDays: null, tripNights: null, travelPurpose: '', baggageType: '' };

export function localToday(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Date-only UTC arithmetic: no local midnight or daylight-saving transitions.
export function dayNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time / 86400000;
}

export function dateErrors(trip: Pick<Trip, 'departureDate' | 'returnDate'>, today = localToday()) {
  const departure = dayNumber(trip.departureDate);
  const returning = dayNumber(trip.returnDate);
  return {
    departure: !trip.departureDate ? '출발일을 선택해 주세요.' : departure === null ? '올바른 출발일을 입력해 주세요.' : trip.departureDate < today ? '출발일은 오늘 이후로 선택해 주세요.' : '',
    returning: !trip.returnDate ? '귀국일을 선택해 주세요.' : returning === null ? '올바른 귀국일을 입력해 주세요.' : trip.returnDate < today ? '귀국일은 오늘 이후로 선택해 주세요.' : departure !== null && returning < departure ? '귀국일은 출발일과 같거나 늦어야 해요.' : '',
  };
}

export function recalculateTrip(trip: Trip, today = localToday()): Trip {
  const errors = dateErrors(trip, today);
  const nights = errors.departure || errors.returning ? null : dayNumber(trip.returnDate)! - dayNumber(trip.departureDate)!;
  return { ...trip, tripNights: nights, tripDays: nights === null ? null : nights + 1 };
}

export function restoreTrip(value: unknown, today = localToday()): Trip {
  if (!value || typeof value !== 'object') return { ...emptyTrip };
  const stored = value as Record<string, unknown>;
  const destination = validateSelection(value);
  if (!destination.countryId || !destination.cityId) return { ...emptyTrip, ...destination };
  let trip: Trip = {
    ...emptyTrip, ...destination,
    departureDate: typeof stored.departureDate === 'string' ? stored.departureDate : '',
    returnDate: typeof stored.returnDate === 'string' ? stored.returnDate : '',
    travelPurpose: purposes.some(item => item.id === stored.travelPurpose) ? stored.travelPurpose as string : '',
    baggageType: baggageOptions.some(item => item.id === stored.baggageType) ? stored.baggageType as string : '',
  };
  const errors = dateErrors(trip, today);
  if (errors.departure) trip = { ...trip, departureDate: '' };
  if (errors.returning) trip = { ...trip, returnDate: '' };
  return recalculateTrip(trip, today);
}

export function loadTrip(storage: Pick<Storage, 'getItem'>, today = localToday()): Trip {
  try {
    const raw = storage.getItem(tripKey);
    // Migrate the existing destination selection once, without losing it.
    return raw === null ? { ...emptyTrip, ...loadSelection(storage) } : restoreTrip(JSON.parse(raw), today);
  } catch { return { ...emptyTrip }; }
}

export function tripComplete(trip: Trip, today = localToday()): boolean {
  const valid = restoreTrip(trip, today);
  return !!(valid.countryId && valid.cityId && valid.departureDate && valid.returnDate && valid.travelPurpose && valid.baggageType && valid.tripDays);
}
