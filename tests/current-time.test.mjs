import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { getCurrentCityTime, formatKoreaDifference, utcOffsetMinutes } = await loadTs('src/service/data/currentTime.ts');
const { destinations } = await loadTs('src/service/destination/destinations.ts');

test('all 17 supported cities format current Korean 12-hour time', () => {
  const now = new Date('2026-10-24T01:30:00Z');
  const expected = { JP: 0, VN: -120, TH: -120, TW: -60, US: null, AU: 120 };
  let count = 0;
  for (const country of destinations) for (const city of country.cities) {
    const clock = getCurrentCityTime(city.id, now);
    assert.ok(clock, city.id);
    assert.match(clock.time, /^(오전|오후) \d{1,2}:30$/);
    assert.equal(clock.differenceMinutes, country.id === 'US' ? (city.id === 'new-york' ? -780 : -960) : expected[country.id]);
    count++;
  }
  assert.equal(count, 17);
  assert.equal(getCurrentCityTime('tokyo', now).time, '오전 10:30');
  assert.equal(getCurrentCityTime('tokyo', now).difference, '시차 없음');
});

test('US and Australian DST transitions use the supplied current instant', () => {
  for (const [city, before, after, first, second] of [
    ['new-york', '2026-11-01T05:59:00Z', '2026-11-01T06:00:00Z', -780, -840],
    ['los-angeles', '2026-11-01T08:59:00Z', '2026-11-01T09:00:00Z', -960, -1020],
    ['sydney', '2026-10-03T15:59:00Z', '2026-10-03T16:00:00Z', 60, 120],
    ['melbourne', '2026-10-03T15:59:00Z', '2026-10-03T16:00:00Z', 60, 120],
  ]) {
    assert.equal(getCurrentCityTime(city, new Date(before)).differenceMinutes, first);
    assert.equal(getCurrentCityTime(city, new Date(after)).differenceMinutes, second);
  }
});

test('minute updates, year boundaries, fractional offsets and failures', () => {
  assert.equal(getCurrentCityTime('tokyo', new Date('2026-12-31T15:00:00Z')).time, '오전 12:00');
  assert.equal(getCurrentCityTime('tokyo', new Date('2026-12-31T15:01:00Z')).time, '오전 12:01');
  assert.equal(utcOffsetMinutes(new Date('2026-12-31T23:59:59.999Z'), 'Asia/Kathmandu'), 345);
  assert.equal(formatKoreaDifference(-210), '한국보다 3시간 30분 느림');
  assert.equal(formatKoreaDifference(30), '한국보다 30분 빠름');
  assert.equal(getCurrentCityTime('missing'), null);
  assert.equal(getCurrentCityTime('tokyo', new Date('invalid')), null);
});
