import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';

const { getClothingPreview, formatClimateValue, getWeatherPoints } = await loadTs('src/service/travel-info/guideModel.ts');
const { getClimateMonth } = await loadTs('src/service/data/climate.ts');
const { clothingItems, clothingPolicy } = await loadTs('src/service/data/clothing.ts');

test('weather points use actual monthly statistics and existing clothing candidates', () => {
  const winter = getWeatherPoints(getClimateMonth('sapporo', 1), 'sightseeing');
  const summer = getWeatherPoints(getClimateMonth('osaka', 8), 'sightseeing');
  assert.notDeepEqual(winter, summer);
  assert.match(winter.suggestions.join(' '), /겨울 외투/);
  assert.match(summer.suggestions.join(' '), /반팔/);
  assert.match(winter.observations.join(' '), /평균 최고.*평균 최저.*차이는/);
  assert.match(summer.observations.join(' '), /월강수량 평균/);
  assert.doesNotMatch(JSON.stringify(winter), /강설|습도|바람/);
});

test('weather points omit missing, invalid and incompatible measurements', () => {
  assert.equal(getWeatherPoints(getClimateMonth('haiphong', 1), 'sightseeing'), null);
  const climate = structuredClone(getClimateMonth('tokyo', 1));
  climate.recommendedMetrics.precipitationMm.value = null;
  climate.recommendedMetrics.meanDailyMinimumC.period = { startYear: 1991, endYear: 2020 };
  const points = getWeatherPoints(climate, 'sightseeing');
  assert.doesNotMatch(points.observations.join(' '), /強|강수|차이는/);
  assert.equal(points.suggestions.length, 0);
  for (const metric of Object.values(climate.recommendedMetrics)) metric.value = null;
  assert.equal(getWeatherPoints(climate, 'sightseeing'), null);
  climate.recommendedMetrics.meanTemperatureC.value = NaN;
  assert.equal(getWeatherPoints(climate, 'sightseeing'), null);
});

test('clothing preview reuses draft items and rules, retains checklist IDs and review status', () => {
  const winter = getClothingPreview(getClimateMonth('sapporo', 1), 'sightseeing');
  assert.ok(winter.some(item => item.id === 'winter-coat'));
  assert.ok(winter.some(item => item.id === 'cold-weather-accessories'));
  assert.ok(!winter.some(item => item.id === 't-shirt'));
  assert.equal(clothingPolicy.enabled, false);
  for (const item of winter) {
    assert.equal(item.status, 'review-required');
    assert.equal(item.author, 'PACK MY BAG');
    assert.equal(item.kind, 'service-recommendation');
    assert.equal(item.checklistItemId, clothingItems.find(source => source.id === item.id).checklistItemId);
    assert.ok(item.reason && item.reviewNotes.length);
  }
});

test('purpose filtering and summer/winter conditions change clothing candidates', () => {
  const summer = getClimateMonth('osaka', 8);
  const sightseeing = getClothingPreview(summer, 'sightseeing');
  const business = getClothingPreview(summer, 'business');
  assert.ok(sightseeing.some(item => item.id === 't-shirt'));
  assert.ok(sightseeing.some(item => item.id === 'walking-shoes'));
  assert.ok(!sightseeing.some(item => item.id === 'shirt'));
  assert.ok(business.some(item => item.id === 'shirt'));
  assert.ok(!business.some(item => item.id === 'walking-shoes'));
  assert.ok(!sightseeing.some(item => item.id === 'winter-coat'));
});

test('unavailable or mixed-basis data does not generate clothing candidates or fake numeric values', () => {
  assert.deepEqual(getClothingPreview(getClimateMonth('haiphong', 1), 'sightseeing'), []);
  const base = getClimateMonth('tokyo', 1);
  const missing = structuredClone(base);
  missing.recommendedMetrics.meanTemperatureC.value = null;
  assert.deepEqual(getClothingPreview(missing, 'sightseeing'), []);
  const mixed = structuredClone(base);
  mixed.recommendedMetrics.meanDailyMinimumC.period = { startYear: 1991, endYear: 2020 };
  mixed.recommendedMetrics.meanDailyMinimumC.basis = 'official-30-year-normal';
  assert.deepEqual(getClothingPreview(mixed, 'sightseeing'), []);
  assert.equal(formatClimateValue(null, '°C'), '공식 정보 확인 필요');
  assert.equal(formatClimateValue(NaN, 'mm'), '공식 정보 확인 필요');
  assert.equal(formatClimateValue(5.9, '°C'), '5.9°C');
  assert.equal(formatClimateValue(0, '°C'), '0.0°C');
});
