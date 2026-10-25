import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadTs } from './helpers/load-ts.mjs';
const { getClimateMonth, getTripClimate } = await loadTs('src/service/data/climate.ts');
const { cities } = await loadTs('src/service/data/cities.ts');
const { twStations, twClimateSources } = await loadTs('src/service/data/twClimate.generated.ts');
const { getSource } = await loadTs('src/service/data/sources.ts');
const { getClothingPreview, getWeatherPoints } = await loadTs('src/service/travel-info/guideModel.ts');
const { getDefaultBagItems } = await loadTs('src/service/my-bag/bag.ts');

test('all existing Taiwan cities have 12 official months matching each preserved CWA cell and hash', () => {
  assert.deepEqual(Object.keys(twStations).sort(), cities.filter(c => c.countryId === 'TW').map(c => c.cityId).sort());
  const codes = { meanTemperatureC:'tx', meanDailyMaximumC:'meantxmax', meanDailyMinimumC:'meantxmin', precipitationMm:'precp', relativeHumidityPct:'rh', precipitationDays:'precpday' };
  for (const source of twClimateSources) {
    assert.equal(createHash('sha256').update(readFileSync(source.snapshotPath)).digest('hex'), source.sha256);
    assert.ok(getSource(source.id));
  }
  for (const [city, name] of [['taipei','臺北'],['kaohsiung','高雄']]) {
    for (const [key, code] of Object.entries(codes)) {
      const html = readFileSync(`src/service/data/raw/tw/Taiwan_${code}.html`, 'utf8');
      const row = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].find(m => m[1].includes(`>${name}</th>`))[1];
      assert.match(row, /headers="period">1991~2020<\/td>/);
      for(let month=1;month<=12;month++) {
        const expected = Number(row.match(new RegExp(`headers="m${month-1}">([^<]+)</td>`))[1]);
        const climate = getClimateMonth(city,month);
        const metric = climate.recommendedMetrics[key] ?? climate.additionalMetrics[key];
        assert.equal(metric.value, expected, `${city}/${key}/${month}`);
        assert.equal(metric.basis, 'official-30-year-normal');
        assert.deepEqual(metric.period,{startYear:1991,endYear:2020});
        assert.equal(climate.stationId,twStations[city].stationId);
        for(const id of metric.sourceIds) assert.ok(getSource(id));
      }
    }
  }
});

test('official means are direct values, station histories stay explicit, and extreme values are not substituted', () => {
  const jan=getClimateMonth('taipei',1), july=getClimateMonth('taipei',7);
  assert.deepEqual([jan.recommendedMetrics.meanTemperatureC.value,jan.recommendedMetrics.meanDailyMaximumC.value,jan.recommendedMetrics.meanDailyMinimumC.value],[16.4,19.4,14.2]);
  assert.equal(july.recommendedMetrics.meanTemperatureC.value,29.9);
  assert.equal(getClimateMonth('taipei',11).recommendedMetrics.meanTemperatureC.value,21.9);
  assert.equal(getClimateMonth('kaohsiung',1).recommendedMetrics.meanTemperatureC.value,19.7);
  assert.equal(getClimateMonth('kaohsiung',7).recommendedMetrics.meanTemperatureC.value,29.4);
  assert.notEqual(jan.recommendedMetrics.meanTemperatureC.value,(19.4+14.2)/2);
  assert.match(jan.provenance.method,/466921/);
  assert.match(getClimateMonth('kaohsiung',1).provenance.method,/467440/);
  for(const month of [0,13,1.5]) assert.throws(()=>getClimateMonth('taipei',month),RangeError);
});

test('season, rain, humidity and purpose feed existing clothing rules and unique checklist IDs', () => {
  const winter=getClothingPreview(getClimateMonth('taipei',1),'sightseeing');
  const summer=getClothingPreview(getClimateMonth('taipei',7),'sightseeing');
  assert.ok(winter.some(i=>i.id==='light-long-sleeve'));
  assert.ok(winter.some(i=>i.id==='light-jacket'));
  assert.ok(!winter.some(i=>i.id==='t-shirt'));
  assert.ok(summer.some(i=>i.id==='t-shirt'));
  assert.ok(summer.some(i=>i.id==='rain-protection'));
  assert.ok(!summer.some(i=>i.id==='light-jacket'));
  assert.ok(getClothingPreview(getClimateMonth('kaohsiung',1),'sightseeing').some(i=>i.id==='cardigan'));
  assert.ok(getClothingPreview(getClimateMonth('taipei',7),'business').some(i=>i.id==='shirt'));
  assert.ok(!getClothingPreview(getClimateMonth('taipei',7),'relaxation').some(i=>i.id==='walking-shoes'));
  assert.ok(getWeatherPoints(getClimateMonth('kaohsiung',7),'sightseeing').suggestions.some(s=>s.includes('통풍')));
  const trip={countryId:'TW',cityId:'taipei',departureDate:'2099-12-29',returnDate:'2100-01-03',travelPurpose:'sightseeing',baggageType:'checked'};
  const segments=getTripClimate(trip.cityId,trip.departureDate,trip.returnDate);
  assert.deepEqual(segments.map(s=>[s.year,s.month,s.climate.recommendedMetrics.meanTemperatureC.value]),[[2099,12,18.2],[2100,1,16.4]]);
  const items=getDefaultBagItems(trip);
  assert.equal(new Set(items.map(i=>i.id)).size,items.length);
  for(const s of segments) for(const item of getClothingPreview(s.climate,trip.travelPurpose)) assert.ok(items.some(i=>i.id===item.checklistItemId));
  assert.equal(getClimateMonth('osaka',11).recommendedMetrics.meanTemperatureC.value.toFixed(1),'14.2');
  for(const city of ['haiphong','haiphong','unknown','toString']) assert.equal(getClimateMonth(city,1).recommendedMetrics,null);
});
