import { internationalCityZones } from './international';

// Compare full calendar dates so offsets remain correct across midnight/year boundaries.
export function utcOffsetMinutes(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return (Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'))
    - Math.floor(now.getTime() / 1000) * 1000) / 60000;
}

export function formatKoreaDifference(minutes: number): string {
  if (minutes === 0) return '시차 없음';
  const absolute = Math.abs(minutes);
  const duration = [Math.floor(absolute / 60) ? `${Math.floor(absolute / 60)}시간` : '', absolute % 60 ? `${absolute % 60}분` : ''].filter(Boolean).join(' ');
  return `한국보다 ${duration} ${minutes > 0 ? '빠름' : '느림'}`;
}

export function getCurrentCityTime(cityId: string, now = new Date()) {
  const zone = internationalCityZones[cityId];
  if (!zone || !Number.isFinite(now.getTime())) return null;
  try {
    const time = new Intl.DateTimeFormat('ko-KR', {
      timeZone: zone.ianaId, hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(now);
    const differenceMinutes = utcOffsetMinutes(now, zone.ianaId) - utcOffsetMinutes(now, 'Asia/Seoul');
    return { time, differenceMinutes, difference: formatKoreaDifference(differenceMinutes) };
  } catch {
    return null;
  }
}
