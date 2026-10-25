import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadTs} from './helpers/load-ts.mjs';
const {getClimateMonth,getTripClimate}=await loadTs('src/service/data/climate.ts');
const {thStations,thClimateSources}=await loadTs('src/service/data/thClimate.generated.ts');
const {destinations}=await loadTs('src/service/destination/destinations.ts');
const {getClothingPreview,getWeatherPoints}=await loadTs('src/service/travel-info/guideModel.ts');
const {getDefaultBagItems,restoreBag}=await loadTs('src/service/my-bag/bag.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const means={bangkok:[27.6,28.7,29.8,30.8,30.5,29.8,29.3,29.1,28.7,28.5,28.4,27.4],chiangmai:[22.3,24.4,27.4,29.6,28.8,28.2,27.7,27.2,27.2,26.6,24.7,22.5],phuket:[27.6,28.3,28.8,29,28.8,28.5,28.2,28.2,27.7,27.3,27.4,27.2]};
const rain={bangkok:[24.2,19.4,53.6,92.7,215.4,209.9,182.9,212,343.6,304,46.5,13.5],chiangmai:[11.3,10.3,15,54.8,164.5,126.8,143,216,207.1,123.8,29.8,10],phuket:[102.2,48.9,117.8,154.5,316.4,374.6,275.9,372.2,393.9,332.5,228.9,103.2]};

test('all and only the three supported Thai cities expose 36 official JMA months and separate TMD metrics',()=>{
  assert.deepEqual(Object.keys(thStations).sort(),destinations.find(c=>c.id==='TH').cities.map(c=>c.id).sort());
  for(const source of thClimateSources){assert.equal(createHash('sha256').update(readFileSync(source.snapshotPath)).digest('hex'),source.sha256);assert.equal(getSource(source.id).lastVerified,'2026-10-25');}
  for(const [city,stationId] of [['bangkok','48455'],['chiangmai','48327'],['phuket','48565']])for(let month=1;month<=12;month++){
    const c=getClimateMonth(city,month),m=c.recommendedMetrics;
    assert.equal(c.stationId,stationId);assert.equal(m.meanTemperatureC.value,means[city][month-1]);assert.equal(m.precipitationMm.value,rain[city][month-1]);
    for(const metric of Object.values(m)){assert.deepEqual(metric.period,{startYear:1991,endYear:2020});assert.equal(metric.basis,'official-30-year-normal');assert.ok(metric.sourceIds.every(id=>id.startsWith('th-')));}
    assert.equal(m.meanDailyMaximumC.sourceIds[0],`th-tmd-${stationId}`);assert.equal(m.meanDailyMinimumC.sourceIds[0],`th-tmd-${stationId}`);assert.equal(m.meanTemperatureC.sourceIds[0],`th-jma-${stationId}`);
    assert.ok(m.meanDailyMaximumC.value>m.meanDailyMinimumC.value);assert.equal(c.additionalMetrics.relativeHumidityPct.value,null);
  }
  assert.equal(getClimateMonth('pattaya',1).recommendedMetrics,null);assert.equal(getClimateMonth('kosamui',1).recommendedMetrics,null);
});
test('TMD extraction uses mean maximum/minimum, not extremes; airport reference and metadata differences remain visible',()=>{
  const rows=JSON.parse(readFileSync('src/service/data/raw/th/tmd-temperature-extract.json')).stations;
  for(const [city,id] of [['bangkok','48455'],['chiangmai','48327'],['phuket','48565']])for(let month=1;month<=12;month++){
    const m=getClimateMonth(city,month).recommendedMetrics;assert.equal(m.meanDailyMaximumC.value,rows[id].high[month-1]);assert.equal(m.meanDailyMinimumC.value,rows[id].low[month-1]);
  }
  const c=getClimateMonth('chiangmai',12).recommendedMetrics;assert.equal(c.meanDailyMaximumC.value,29.2);assert.equal(c.meanDailyMinimumC.value,16.9);assert.equal(c.meanTemperatureC.value,22.5);
  assert.equal(getClimateMonth('bangkok',4).recommendedMetrics.meanDailyMaximumC.value,35.7);assert.equal(getClimateMonth('phuket',9).recommendedMetrics.meanDailyMinimumC.value,24.1);
  assert.match(getClimateMonth('phuket',9).provenance.displayNote,/푸껫공항/);assert.match(getClimateMonth('phuket',9).provenance.method,/역산하지/);assert.match(getClimateMonth('chiangmai',12).warnings.join(' '),/고도에 차이/);
});
test('temperature, rainfall and purpose produce distinct existing packing IDs and survive restoration',()=>{
  const ids=(city,month,purpose='sightseeing')=>getClothingPreview(getClimateMonth(city,month),purpose).map(i=>i.id);
  assert.ok(ids('bangkok',4).includes('t-shirt'));assert.ok(!ids('bangkok',4).includes('rain-protection'));
  assert.ok(ids('bangkok',9).includes('rain-protection'));assert.ok(ids('chiangmai',12).includes('cardigan'));assert.ok(ids('chiangmai',12).includes('light-long-sleeve'));assert.ok(!ids('chiangmai',12).includes('rain-protection'));
  assert.ok(ids('phuket',9,'relaxation').includes('swimwear'));assert.ok(ids('phuket',9,'relaxation').includes('rain-protection'));assert.ok(!ids('phuket',9).includes('swimwear'));assert.ok(!ids('bangkok',9,'relaxation').includes('swimwear'));
  const trip={countryId:'TH',cityId:'phuket',departureDate:'2027-09-10',returnDate:'2027-09-15',travelPurpose:'relaxation',baggageType:'checked'},bag=getDefaultBagItems(trip);
  assert.equal(new Set(bag.map(i=>i.id)).size,bag.length);assert.equal(bag.filter(i=>i.id==='clothing:swimwear').length,1);assert.match(bag.find(i=>i.id==='clothing:rain-protection').note,/월강수량/);
  assert.deepEqual(restoreBag({version:1,checkedIds:['clothing:rain-protection','electronic:travel-adapter'],customItems:[]},bag).checkedIds,['clothing:rain-protection','electronic:travel-adapter']);
  assert.deepEqual(getTripClimate('chiangmai','2027-12-29','2028-01-03').map(s=>[s.year,s.month,s.climate.recommendedMetrics.meanTemperatureC.value]),[[2027,12,22.5],[2028,1,22.3]]);
  assert.ok(!JSON.stringify(getWeatherPoints(getClimateMonth('chiangmai',12),'sightseeing')).includes('대기질'));
  assert.equal(getClimateMonth('nhatrang',12).recommendedMetrics.meanTemperatureC.value,25.1);assert.equal(getClimateMonth('nhatrang',12).recommendedMetrics.meanDailyMinimumC.value,null);
});
