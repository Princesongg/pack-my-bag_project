import { getPassportRule } from '../data/passportRules';
import { getSource } from '../data/sources';
import { dayNumber } from '../trip/trip';

// Calendar months, clamped to the last day when the target month is shorter.
// Date-only UTC arithmetic also works across leap years and daylight-saving changes.
export function addCalendarMonths(value: string, months: number): string | null {
  if (dayNumber(value) === null || !Number.isInteger(months) || months < 0) return null;
  const [year, month, day] = value.split('-').map(Number);
  const index = year * 12 + month - 1 + months, nextYear = Math.floor(index / 12), nextMonth = index % 12;
  if (nextYear < 1 || nextYear > 9999) return null;
  const last = new Date(0); last.setUTCFullYear(nextYear, nextMonth + 1, 0);
  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth + 1).padStart(2, '0')}-${String(Math.min(day, last.getUTCDate())).padStart(2, '0')}`;
}

export type PassportContext = { scopeConfirmed: boolean; route: 'unknown' | 'direct' | 'checked' };
export function assessPassport(countryId: string, departure: string, returning: string, expiry: string, context: PassportContext) {
  const rule = getPassportRule(countryId);
  const review = (message: string) => ({ status: 'review' as const, title: '추가 확인 필요', message, action: '조건을 확인하고 해당 국가의 공식 안내를 살펴보세요.', requiredExpiry: null as string | null });
  const start = dayNumber(departure), back = dayNumber(returning), end = dayNumber(expiry);
  if (start === null || back === null || back < start) return review('올바른 여행 시작일과 종료일을 먼저 확인해 주세요.');
  if (!rule || !rule.sourceIds.length || !rule.sourceIds.every(id => { const s = getSource(id); return s?.status === 'verified' && !!s.lastVerified && /^https:\/\//.test(s.url); })) return review('해당 국가의 공식 여권 유효기간 기준을 확인하지 못했어요.');
  if ((rule.validFrom && departure < rule.validFrom) || (rule.validThrough && departure > rule.validThrough) || (rule.maximumStayDays && back - start + 1 > rule.maximumStayDays)) return review('현재 확인한 일반 무비자 적용 기간이나 체류 범위를 벗어나요. 비자·입국 조건을 별도로 확인해 주세요.');
  const sixMonths = rule.method === 'entry-six-months' ? addCalendarMonths(departure, 6) : returning;
  if (!sixMonths) return review('계산 가능한 여행 날짜 범위를 확인해 주세요.');
  const requiredExpiry = sixMonths > returning ? sixMonths : returning;
  if (!expiry || end === null) return { ...review(expiry ? '올바른 여권 만료일을 입력해 주세요.' : '여권 만료일과 아래 적용 조건을 입력해 주세요.'), requiredExpiry };
  if (!context.scopeConfirmed) return { ...review('한국 일반여권·단기 관광의 일반 무비자 기준이 내 여행에 적용되는지 확인해 주세요.'), requiredExpiry };
  if (expiry < requiredExpiry) return { status: 'failed' as const, title: '기준 미달', message: '현재 입력한 여권은 기본 유효기간 기준에 미달해요.', action: '출발 전 여권 갱신이 필요할 수 있어요. 갱신 일정과 공식 입국 조건을 확인해 주세요.', requiredExpiry };
  if (!['direct', 'checked'].includes(context.route)) return { ...review('기본 날짜 기준은 맞지만 경유 조건이 확인되지 않았어요. 경유지와 이용 항공사의 요건을 확인해 주세요.'), requiredExpiry };
  return { status: 'met' as const, title: '기본 날짜 조건 충족', message: '기본 유효기간 조건을 충족해요.', action: '입국 허가를 보장하지 않아요. 비자·입국허가와 항공사 등 나머지 조건도 출발 전에 확인하세요.', requiredExpiry };
}
