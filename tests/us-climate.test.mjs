import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadTs } from './helpers/load-ts.mjs';
const { getClimateMonth, getTripClimate } = await loadTs('src/service/data/climate.ts');
const { getClothingPreview } = await loadTs('src/service/travel-info/guideModel.ts');
const { getDefaultBagItems } = await loadTs('src/service/my-bag/bag.ts');
const { getSource } = await loadTs('src/service/data/sources.ts');
const expected = {
  'new-york': [[0.9,4.2,-2.3],[2.2,5.7,-1.4],[6,9.9,2.1],[12.1,16.6,7.5],[17.3,21.9,12.8],[22.2,26.5,18],[25.3,29.4,21.2],[24.5,28.5,20.5],[20.7,24.6,16.8],[14.4,18.1,10.8],[8.9,12.2,5.6],[3.9,6.8,1]],
  'los-angeles': [[14.4,19.1,9.7],[14.4,18.7,10.1],[15.1,18.9,11.2],[16.2,20.1,12.3],[17.6,20.8,14.2],[19.1,22.2,16.1],[20.9,23.9,17.8],[21.5,24.8,18.2],[21.2,24.7,17.6],[19.5,23.6,15.4],[16.8,21.6,12.1],[14.2,18.9,9.5]],
};
test('all 24 official normal months match independently supplied Celsius values and retain sources', () => {
  for(const [city, rows] of Object.entries(expected)) rows.forEach((row,index) => {
    const climate = getClimateMonth(city,index+1), m=climate.recommendedMetrics;
    assert.deepEqual([m.meanTemperatureC.value,m.meanDailyMaximumC.value,m.meanDailyMinimumC.value],row);
    assert.equal(climate.recent,null);
    assert.equal(m.precipitationMm.value,null);
    for(const key of ['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC']) {
      assert.equal(m[key].basis,'official-30-year-normal');
      assert.deepEqual(m[key].period,{startYear:1991,endYear:2020});
      const source=getSource(m[key].sourceIds[0]);assert.equal(source.status,'verified');
      assert.equal(createHash('sha256').update(readFileSync(source.snapshotPath)).digest('hex'),source.sha256);
    }
  });
});
test('New York October-November preserves separate months and connects clothing IDs without rainfall', () => {
  const segments=getTripClimate('new-york','2026-10-30','2026-11-03');
  assert.deepEqual(segments.map(s=>s.month),[10,11]);
  assert.deepEqual(segments.map(s=>s.climate.recommendedMetrics.meanTemperatureC.value),[14.4,8.9]);
  for(const segment of segments)assert.ok(getClothingPreview(segment.climate,'sightseeing').some(i=>i.id==='light-long-sleeve'));
  const items=getDefaultBagItems({countryId:'US',cityId:'new-york',departureDate:'2026-10-30',returnDate:'2026-11-03',travelPurpose:'sightseeing',baggageType:'checked'});
  assert.ok(items.some(i=>i.id==='clothing:light-jacket'));
  assert.equal(new Set(items.map(i=>i.id)).size,items.length);
});
test('New York winter and LAX summer produce different existing recommendations; missing countries stay missing', () => {
  const winter=getClothingPreview(getClimateMonth('new-york',1),'sightseeing');
  const summer=getClothingPreview(getClimateMonth('los-angeles',7),'sightseeing');
  assert.ok(winter.some(i=>i.id==='winter-coat'));
  assert.ok(winter.some(i=>i.id==='cold-weather-accessories'));
  assert.ok(summer.some(i=>i.id==='light-long-sleeve'));
  assert.ok(!summer.some(i=>i.id==='winter-coat'||i.id==='rain-protection'));
  assert.notDeepEqual(winter,summer);
  for(const city of ['haiphong','haiphong','unknown'])assert.equal(getClimateMonth(city,1).recommendedMetrics,null);
  const tokyo=getClimateMonth('tokyo',1).recommendedMetrics;
  assert.equal(tokyo.meanTemperatureC.value,5.9);
  assert.deepEqual(tokyo.meanTemperatureC.period,{startYear:2016,endYear:2025});
});
