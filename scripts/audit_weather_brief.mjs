import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTs } from '../tests/helpers/load-ts.mjs';
const { destinations } = await loadTs('src/service/destination/destinations.ts');
const { getClimateMonth } = await loadTs('src/service/data/climate.ts');
const { getWeatherSegments, getWeatherBrief } = await loadTs('src/service/my-bag/weatherBriefModel.ts');
const { getDefaultBagItems } = await loadTs('src/service/my-bag/bag.ts');
const { sources } = await loadTs('src/service/data/sources.ts');
const output = 'docs/verification/weather-brief';
fs.mkdirSync(output, { recursive: true });
const rows = [], ids = destinations.flatMap(c => c.cities.map(city => city.id));
assert.equal(new Set(ids).size, ids.length, 'Global city identifiers must be unique');
for (const country of destinations) for (const city of country.cities) for (let month = 1; month <= 12; month++) {
  const trip = { countryId: country.id, cityId: city.id, departureDate: `2027-${String(month).padStart(2, '0')}-10`, returnDate: `2027-${String(month).padStart(2, '0')}-15`, travelPurpose: 'sightseeing', baggageType: 'checked' };
  const segment = getWeatherSegments(trip)[0], climate = getClimateMonth(city.id, month), brief = getWeatherBrief(segment.climate, trip.travelPurpose);
  assert.equal(segment.month, month); assert.equal(climate.cityId, city.id); assert.deepEqual(segment.climate, climate);
  if ('countryId' in climate) assert.equal(climate.countryId, country.id);
  for (const metric of Object.values(climate.recommendedMetrics ?? {})) {
    assert.ok(metric.value === null || Number.isFinite(metric.value));
    if (metric.value !== null) assert.ok(metric.sourceIds.length);
    for (const id of metric.sourceIds) assert.ok(sources.some(source => source.id === id), id);
  }
  const bag = getDefaultBagItems(trip);
  for (const item of brief.clothing) assert.ok(bag.some(b => b.id === item.checklistItemId && b.name === item.name));
  if (brief.range) { assert.ok(brief.range.low <= brief.mean && brief.mean <= brief.range.high); assert.ok(brief.range.meanPosition >= 0 && brief.range.meanPosition <= 100); }
  rows.push({ countryId: country.id, country: country.name, cityId: city.id, city: city.name, month, status: 'PASS', metrics: climate.recommendedMetrics, stationId: climate.stationId, provenance: climate.provenance, range: brief.range, clothing: brief.clothing.map(i => ({ id: i.checklistItemId, name: i.name, ruleId: i.ruleId })), missing: ['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC','precipitationMm'].filter(k => climate.recommendedMetrics?.[k].value == null) });
}
const example = getClimateMonth('osaka', 11);
for (const absent of ['meanDailyMaximumC', 'meanDailyMinimumC']) {
  const partial = structuredClone(example); partial.recommendedMetrics[absent].value = null;
  assert.equal(getWeatherBrief(partial, 'sightseeing').range, null);
}
for (const change of ['series', 'period', 'basis', 'invalid', 'reversed']) {
  const mixed = structuredClone(example), high = mixed.recommendedMetrics.meanDailyMaximumC;
  if (change === 'series') high.comparisonGroup = 'another-station';
  if (change === 'period') high.period = { startYear: 1991, endYear: 2020 };
  if (change === 'basis') high.basis = 'needs-research';
  if (change === 'invalid') high.value = NaN;
  if (change === 'reversed') high.value = -100;
  assert.equal(getWeatherBrief(mixed, 'sightseeing').range, null);
}
const trip = { countryId: 'JP', cityId: 'osaka', departureDate: '2027-12-30', returnDate: '2028-01-03', travelPurpose: 'sightseeing', baggageType: 'checked' };
assert.deepEqual(getWeatherSegments(trip).map(s => [s.year,s.month,s.daysCovered]), [[2027,12,2],[2028,1,3]]);
assert.ok(getWeatherSegments({ ...trip, countryId: 'TH' }).every(s => s.climate.recommendedMetrics === null));
assert.ok(getWeatherSegments({ ...trip, cityId: '大阪' }).every(s => s.climate.recommendedMetrics === null));
fs.writeFileSync(output + '/data-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), countries: destinations.length, cities: ids.length, rows, syntheticMissingAndIncompatibleTests: 'PASS', countryMismatchTests: 'PASS', crossYearTests: 'PASS' }, null, 2));
console.log(JSON.stringify({ countries: destinations.length, cities: ids.length, cityMonths: rows.length, graphMonths: rows.filter(r => r.range).length, missing: rows.filter(r => r.missing.length).map(r => ({ cityId:r.cityId,month:r.month,missing:r.missing })) }));
