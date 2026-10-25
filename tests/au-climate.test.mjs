import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadTs } from './helpers/load-ts.mjs';
const { getClimateMonth, getTripClimate }=await loadTs('src/service/data/climate.ts');
const { getClothingPreview, formatClimateBasis }=await loadTs('src/service/travel-info/guideModel.ts');
const { getDefaultBagItems }=await loadTs('src/service/my-bag/bag.ts');
const { auStations, southernSeason }=await loadTs('src/service/data/auClimate.ts');
const manifest=JSON.parse(readFileSync('src/service/data/raw/au/collection-manifest.json','utf8'));
test('all 24 Australian months match raw official HTML rows, periods, counts and snapshot hashes',()=>{
  for(const record of manifest){
    const html=readFileSync(record.snapshotPath,'utf8');
    assert.equal(createHash('sha256').update(readFileSync(record.snapshotPath)).digest('hex'),record.sha256);
    const rawRows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(match=>[...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(cell=>cell[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())).filter(row=>/Mean maximum temperature|Mean minimum temperature|Mean rainfall/.test(row[0]??''));
    assert.equal(rawRows.length,3);
    for(let month=1;month<=12;month++){
      const climate=getClimateMonth(record.cityId,month),m=climate.recommendedMetrics;
      const values=rawRows.map(row=>Number(row[month]));
      assert.deepEqual([m.meanDailyMaximumC.value,m.meanDailyMinimumC.value,m.precipitationMm.value],values);
      assert.equal(m.meanTemperatureC.value,Math.round((Math.round(values[0]*10)+Math.round(values[1]*10))/2)/10);
      assert.equal(m.meanTemperatureC.basis,'derived-high-low-midpoint');
      assert.match(formatClimateBasis(m.meanTemperatureC),/계산 참고값/);
      for(const [key,index] of [['meanDailyMaximumC',0],['meanDailyMinimumC',1],['precipitationMm',2]]){
        assert.equal(m[key].basis,'all-years-of-record');
        assert.equal(m[key].availableYears,Number(rawRows[index][14]));
        const range=rawRows[index][15].split(' ').map(Number);
        assert.deepEqual(m[key].period,{startYear:range[0],endYear:range[1]});
      }
      assert.equal(climate.officialNormal,null);assert.equal(climate.recent,null);
      assert.equal(climate.stationId,record.stationId);
      assert.equal(climate.provenance.label,'전체 가용 관측기간 통계');
    }
  }
  assert.notDeepEqual(auStations.sydney.temperaturePeriod,auStations.sydney.rainfallPeriod);
});
test('southern seasons and temperature-first clothing use real values, not hemisphere-only rules',()=>{
  assert.deepEqual([1,4,7,10].map(southernSeason),['여름','가을','겨울','봄']);
  const ids=(city,month)=>getClothingPreview(getClimateMonth(city,month),'sightseeing').map(i=>i.id);
  assert.ok(ids('sydney',1).includes('t-shirt'));
  assert.ok(ids('sydney',7).includes('light-jacket'));
  assert.ok(ids('melbourne',1).includes('cardigan'));
  assert.ok(ids('melbourne',7).includes('knit'));
  assert.ok(!ids('melbourne',7).includes('t-shirt'));
  const idsAll=getDefaultBagItems({countryId:'AU',cityId:'sydney',departureDate:'2026-12-30',returnDate:'2027-01-03',travelPurpose:'sightseeing',baggageType:'checked'}).map(i=>i.id);
  assert.equal(idsAll.length,new Set(idsAll).size);assert.ok(idsAll.includes('clothing:t-shirt'));
});
test('year boundaries and existing US/Japan values remain independent',()=>{
  const trip=getTripClimate('sydney','2026-12-30','2027-01-03');
  assert.deepEqual(trip.map(s=>[s.year,s.month]),[[2026,12],[2027,1]]);
  assert.deepEqual(trip.map(s=>s.climate.recommendedMetrics.meanDailyMaximumC.value),[26,26.8]);
  assert.equal(getClimateMonth('new-york',1).recommendedMetrics.meanTemperatureC.value,0.9);
  assert.equal(getClimateMonth('new-york',1).recommendedMetrics.meanTemperatureC.basis,'official-30-year-normal');
  assert.equal(getClimateMonth('tokyo',1).recommendedMetrics.meanTemperatureC.value,5.9);
  assert.equal(getClimateMonth('tokyo',1).recommendedMetrics.meanTemperatureC.basis,'recent-10-year-observations');
  assert.equal(getClimateMonth('haiphong',1).recommendedMetrics,null);
});
