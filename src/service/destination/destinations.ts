export const destinations = [
  { id: 'JP', name: '일본', english: 'Japan', flag: '🇯🇵', cities: [
    { id: 'tokyo', name: '도쿄', english: 'Tokyo' }, { id: 'osaka', name: '오사카', english: 'Osaka' },
    { id: 'fukuoka', name: '후쿠오카', english: 'Fukuoka' }, { id: 'sapporo', name: '삿포로', english: 'Sapporo' },
  ] },
  { id: 'VN', name: '베트남', english: 'Vietnam', flag: '🇻🇳', cities: [
    { id: 'danang', name: '다낭', english: 'Da Nang' }, { id: 'hanoi', name: '하노이', english: 'Hanoi' },
    { id: 'nhatrang', name: '나트랑', english: 'Nha Trang' }, { id: 'phuquoc', name: '푸꾸옥', english: 'Phu Quoc' },
  ] },
  { id: 'TH', name: '태국', english: 'Thailand', flag: '🇹🇭', cities: [
    { id: 'bangkok', name: '방콕', english: 'Bangkok' }, { id: 'phuket', name: '푸껫', english: 'Phuket' },
    { id: 'chiangmai', name: '치앙마이', english: 'Chiang Mai' },
  ] },
  { id: 'TW', name: '대만', english: 'Taiwan', flag: '🇹🇼', cities: [
    { id: 'taipei', name: '타이베이', english: 'Taipei' }, { id: 'kaohsiung', name: '가오슝', english: 'Kaohsiung' },
  ] },
  { id: 'US', name: '미국', english: 'United States', flag: '🇺🇸', cities: [
    { id: 'new-york', name: '뉴욕', english: 'New York' }, { id: 'los-angeles', name: '로스앤젤레스', english: 'Los Angeles' },
  ] },
  { id: 'AU', name: '호주', english: 'Australia', flag: '🇦🇺', cities: [
    { id: 'sydney', name: '시드니', english: 'Sydney' }, { id: 'melbourne', name: '멜버른', english: 'Melbourne' },
  ] },
] as const;

// Order is editorial; adding supported countries does not grow the popular grid.
export const popularCountryIds: readonly string[] = ['JP', 'VN', 'TH', 'TW', 'US', 'AU'];
export const citySearchThreshold = 8;

export function filterDestinations<T extends { name: string; english: string }>(items: readonly T[], query: string): T[] {
  const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, '');
  const term = normalize(query);
  return items.filter(item => normalize(item.name).includes(term) || normalize(item.english).includes(term));
}

export type DestinationSelection = { countryId: string; cityId: string };
export const selectionKey = 'pack-my-bag.destination.v1';
export const emptySelection: DestinationSelection = { countryId: '', cityId: '' };

export function validateSelection(value: unknown): DestinationSelection {
  if (!value || typeof value !== 'object' || !('countryId' in value)) return emptySelection;
  const country = destinations.find(item => item.id === value.countryId);
  if (!country) return emptySelection;
  const cityId = 'cityId' in value && country.cities.some(city => city.id === value.cityId) ? value.cityId as string : '';
  return { countryId: country.id, cityId };
}

export function selectCountry(current: DestinationSelection, countryId: string): DestinationSelection {
  return validateSelection({ countryId, cityId: current.countryId === countryId ? current.cityId : '' });
}

export function loadSelection(storage: Pick<Storage, 'getItem'>): DestinationSelection {
  try { return validateSelection(JSON.parse(storage.getItem(selectionKey) ?? 'null')); }
  catch { return emptySelection; }
}

export function saveSelection(storage: Pick<Storage, 'setItem'>, selection: DestinationSelection): boolean {
  try { storage.setItem(selectionKey, JSON.stringify(validateSelection(selection))); return true; }
  catch { return false; }
}
