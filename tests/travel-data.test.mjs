import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { loadTs } from './helpers/load-ts.mjs';

const data = await loadTs('src/service/data/index.ts');
const { climateArchive } = await loadTs('src/service/data/climate.generated.ts');
const cityIds = ['tokyo', 'osaka', 'fukuoka', 'sapporo'];

test('all official observation snapshots match their recorded SHA-256 and selected raw cells', () => {
  assert.equal(climateArchive.sources.length, 41);
  for (const source of climateArchive.sources) {
    const body = gunzipSync(readFileSync(resolve('src/service/data', source.snapshotPath)));
    assert.equal(createHash('sha256').update(body).digest('hex'), source.sha256);
    assert.equal(new URL(source.url).hostname, 'www.data.jma.go.jp');
    assert.equal(source.lastVerified, '2026-10-23');
    if (source.id === 'jma-normals-1991-2020') continue;
    // Numeric independent re-extraction from exact response bytes, not generated TS.
    const text = body.toString('latin1');
    const rows = [...text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cell[1].replace(/<[^>]+>/g, '').trim())).filter(row => row.length >= 10 && /^\d{1,2}$/.test(row[0]));
    assert.equal(rows.length, 12);
    for (const observation of climateArchive.observations.filter(row => row.sourceId === source.id)) {
      const row = rows.find(row => Number(row[0]) === observation.month);
      for (const [metric, index] of [['precipitationMm', 3], ['meanTemperatureC', 7], ['meanDailyMaximumC', 8], ['meanDailyMinimumC', 9]]) {
        assert.equal(observation.metrics[metric].raw, row[index]);
        assert.equal(observation.metrics[metric].value, Number(row[index]));
      }
    }
  }
});

test('coverage is exactly four cities, 2016–2025, all 12 months and four numeric metrics', () => {
  assert.equal(climateArchive.observations.length, 480);
  assert.equal(climateArchive.normals.length, 48);
  assert.equal(new Set(climateArchive.observations.map(row => `${row.cityId}/${row.year}/${row.month}`)).size, 480);
  for (const city of cityIds) for (let year = 2016; year <= 2025; year++) {
    assert.deepEqual(climateArchive.observations.filter(row => row.cityId === city && row.year === year).map(row => row.month), Array.from({ length: 12 }, (_, index) => index + 1));
  }
  for (const row of [...climateArchive.observations, ...climateArchive.normals]) {
    const m = row.metrics;
    for (const value of Object.values(m)) { assert.equal(value.quality, 'normal'); assert.ok(Number.isFinite(value.value)); }
    assert.ok(m.meanDailyMinimumC.value <= m.meanTemperatureC.value);
    assert.ok(m.meanTemperatureC.value <= m.meanDailyMaximumC.value);
    assert.ok(m.precipitationMm.value >= 0);
  }
});

test('all 192 monthly aggregates use ten same-month years and retain provenance', () => {
  assert.equal(data.monthlyClimate.length, 48);
  for (const city of cityIds) for (let month = 1; month <= 12; month++) {
    const climate = data.getClimateMonth(city, month);
    assert.equal(climate.continuityReview, 'needs-research');
    for (const metric of data.climateMetricKeys) {
      const result = climate.recent.metrics[metric];
      const rows = climateArchive.observations.filter(row => row.cityId === city && row.month === month);
      const expected = Number((rows.reduce((sum, row) => sum + Number(row.metrics[metric].raw), 0) / 10).toFixed(2));
      assert.equal(result.value, expected);
      assert.equal(result.sampleSize, 10); assert.equal(result.sourceIds.length, 10);
      assert.deepEqual(result.yearsUsed, Array.from({ length: 10 }, (_, index) => 2016 + index));
      assert.equal(climate.recommendedMetrics[metric].basis, 'recent-10-year-observations');
    }
  }
  const tokyo = data.getClimateMonth('tokyo', 1);
  assert.equal(tokyo.recent.metrics.meanTemperatureC.value, 5.9);
  assert.equal(tokyo.recent.metrics.meanDailyMaximumC.value, 10.55);
  assert.equal(tokyo.officialNormal.metrics.meanTemperatureC.value, 5.4);
  assert.deepEqual(tokyo.officialNormal.period, { startYear: 1991, endYear: 2020 });
});

test('missing, flagged, duplicate and changed-station observations are never silently averaged', () => {
  const rows = climateArchive.observations.filter(row => row.cityId === 'tokyo' && row.month === 1);
  const calc = input => data.calculateRecentMetric(input, 'tokyo', 1, 'meanTemperatureC');
  assert.equal(calc(rows.slice(1)).value, null);
  assert.equal(calc(rows.slice(1)).sampleSize, 9);
  assert.equal(calc([...rows, rows[0]]).value, null);
  assert.equal(calc(rows.map((row, index) => index ? row : { ...row, stationId: 'different' })).value, null);
  for (const quality of ['quasi-normal', 'insufficient', 'missing', 'unreviewed']) {
    assert.equal(calc(rows.map((row, index) => index ? row : { ...row, metrics: { ...row.metrics, meanTemperatureC: { ...row.metrics.meanTemperatureC, quality } } })).value, null);
  }
});

test('normal fallback is per metric and retains its own period and label', () => {
  const rows = climateArchive.observations.map(row => row.cityId === 'tokyo' && row.year === 2016 && row.month === 1 ? { ...row, metrics: { ...row.metrics, meanTemperatureC: { value: null, raw: '///', class: '', quality: 'missing' } } } : row);
  const climate = data.getClimateMonth('tokyo', 1, { ...climateArchive, observations: rows });
  assert.equal(climate.recent.metrics.meanTemperatureC.value, null);
  assert.equal(climate.recommendedMetrics.meanTemperatureC.value, 5.4);
  assert.equal(climate.recommendedMetrics.meanTemperatureC.basis, 'official-30-year-normal');
  assert.equal(climate.recommendedMetrics.meanDailyMaximumC.basis, 'recent-10-year-observations');
  assert.equal(data.getClimateMonth('danang', 1).status, 'needs-research');
  assert.throws(() => data.getClimateMonth('tokyo', 13), RangeError);
});

test('trip lookup segments inclusive months, years and leap days without inventing daily weather', () => {
  assert.deepEqual(data.getTripMonthSegments('2026-11-29', '2026-12-02'), [{ year: 2026, month: 11, daysCovered: 2 }, { year: 2026, month: 12, daysCovered: 2 }]);
  assert.deepEqual(data.getTripMonthSegments('2026-12-31', '2027-01-01'), [{ year: 2026, month: 12, daysCovered: 1 }, { year: 2027, month: 1, daysCovered: 1 }]);
  assert.deepEqual(data.getTripMonthSegments('2028-02-28', '2028-03-01').map(item => item.daysCovered), [2, 1]);
  assert.equal(data.getTripClimate('osaka', '2026-11-30', '2026-12-01').length, 2);
  assert.throws(() => data.getTripMonthSegments('2026-02-30', '2026-03-01'), RangeError);
  assert.throws(() => data.getTripMonthSegments('2026-12-02', '2026-11-29'), RangeError);
});

test('evidence references resolve to official sources; pending rules contain no fabricated facts', () => {
  assert.equal(new Set(data.sources.map(source => source.id)).size, data.sources.length);
  const inspect = value => {
    if (!value || typeof value !== 'object') return;
    if (value.status === 'verified' && 'value' in value) {
      assert.ok(value.sourceIds.length);
      for (const id of value.sourceIds) { assert.equal(data.getSource(id)?.status, 'verified'); assert.equal(data.getSource(id).lastVerified, value.lastVerified); }
    }
    if (value.status === 'needs-research' && 'value' in value) assert.equal(value.value, null);
    for (const child of Object.values(value)) inspect(child);
  };
  for (const value of [data.electricity, data.currencies, data.timeZones, data.entryGuides, data.seasonalFeatures, data.baggageRules]) inspect(value);
  assert.equal(data.timeZones.JP.differenceFromKoreaMinutes.value, 0);
  assert.equal(data.entryGuides.JP.services[0].mandatoryForAllTravelers.value, null);
  assert.equal(data.baggageRules.length, 7);
  for (const rule of data.baggageRules.filter(rule => !rule.summary)) { assert.equal(rule.limits.value, null); assert.equal(rule.cabin.value, null); assert.equal(rule.checked.value, null); }
  assert.equal(data.clothingPolicy.kind, 'service-recommendation');
  assert.equal(data.clothingPolicy.enabled, false);
  for (const rule of data.clothingRules) assert.ok(data.clothingItems.some(item => item.id === rule.itemId && item.checklistItemId));
});
