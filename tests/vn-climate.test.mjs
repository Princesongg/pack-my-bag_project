import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadTs} from './helpers/load-ts.mjs';
const {getClimateMonth,getTripClimate}=await loadTs('src/service/data/climate.ts');
const {vnStations,vnClimateSources}=await loadTs('src/service/data/vnClimate.generated.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const {getClothingPreview,getWeatherPoints,formatClimateBasis}=await loadTs('src/service/travel-info/guideModel.ts');
const {getDefaultBagItems}=await loadTs('src/service/my-bag/bag.ts');
const means={hanoi:[17.3,18.8,21.1,24.8,28.1,30.1,29.9,29.2,28.2,26,22.8,18.8],danang:[21.7,22.6,24.4,26.6,28.8,30,29.4,29.3,27.9,26.3,24.9,22.4],nhatrang:[24.4,24.9,26.3,27.8,28.8,29.2,29,29,28.3,27.1,26.2,25.1],phuquoc:[26.8,27.3,28.4,29,29,28.4,27.9,27.9,27.6,27.6,27.8,27.1]};
const rain={hanoi:[28,19,55,79,188,231,300,335,195,126,48,24],danang:[99.8,16.5,34.4,55,53.3,55.2,99.8,143.1,410.4,692.5,471.2,210.2],nhatrang:[69.1,22,32.6,56.3,98.5,43.7,65.8,57.7,169.4,341.8,431.9,228.4],phuquoc:[31,20.6,89.5,137,230.4,368.7,438.1,415.3,542.3,325.6,179.9,76.9]};
test('all 48 Vietnam months match supplied official means/rain and preserved source hashes',()=>{
 assert.deepEqual(Object.keys(vnStations).sort(),['danang','hanoi','nhatrang','phuquoc']);
 for(const source of vnClimateSources){assert.equal(createHash('sha256').update(readFileSync(source.snapshotPath)).digest('hex'),source.sha256);assert.equal(getSource(source.id).lastVerified,'2026-10-25');}
 for(const city of Object.keys(means))for(let month=1;month<=12;month++){
  const c=getClimateMonth(city,month),m=c.recommendedMetrics;
  assert.equal(m.meanTemperatureC.value,means[city][month-1],city+'/'+month);assert.equal(m.precipitationMm.value,rain[city][month-1]);
  for(const metric of Object.values(m)){assert.deepEqual(metric.period,{startYear:1991,endYear:2020});for(const id of metric.sourceIds)assert.ok(getSource(id));}
  if(['nhatrang','phuquoc'].includes(city)){assert.equal(m.meanDailyMaximumC.value,null);assert.equal(m.meanDailyMinimumC.value,null);assert.equal(m.meanDailyMinimumC.basis,'needs-research');assert.deepEqual(m.meanDailyMinimumC.sourceIds,[]);}
 }
});
test('Hanoi midpoint is labelled and WMO high/low are copied independently without replacing JMA mean/rain',()=>{
 for(const [city,file] of [['hanoi','wmo-hanoi.json'],['danang','wmo-danang.json']]){
  const rows=JSON.parse(readFileSync('src/service/data/raw/vn/'+file)).city.climate.climateMonth;
  for(const row of rows){const m=getClimateMonth(city,row.month).recommendedMetrics;assert.equal(m.meanDailyMaximumC.value,Number(row.maxTemp));assert.equal(m.meanDailyMinimumC.value,Number(row.minTemp));}
 }
 const h=getClimateMonth('hanoi',1),d=getClimateMonth('danang',11);
 assert.equal(h.recommendedMetrics.meanTemperatureC.basis,'derived-normal-high-low-midpoint');assert.match(formatClimateBasis(h.recommendedMetrics.meanTemperatureC),/1991–2020.*계산 참고/);
 assert.match(getWeatherPoints(h,'sightseeing').observations[0],/직접.*아닙니다/);assert.ok(!getWeatherPoints(h,'sightseeing').observations[0].includes('BOM'));
 assert.deepEqual(d.recommendedMetrics.meanTemperatureC.sourceIds,['vn-jma-danang','vn-jma-normal-method']);assert.deepEqual(d.recommendedMetrics.meanDailyMaximumC.sourceIds,['vn-wmo-danang']);assert.equal(d.recommendedMetrics.precipitationMm.value,471.2);
 assert.match(d.provenance.method,/좌표가 서로 달라/);
});
test('partial metrics still produce supported rain/mean/purpose suggestions and unique checklist IDs',()=>{
 assert.ok(getClothingPreview(getClimateMonth('hanoi',1),'sightseeing').some(i=>i.id==='light-jacket'));
 for(const [city,month] of [['danang',11],['nhatrang',11],['phuquoc',9]]){
  const c=getClimateMonth(city,month),items=getClothingPreview(c,'sightseeing');assert.ok(items.some(i=>i.id==='rain-protection'));assert.ok(items.some(i=>i.id==='t-shirt'));assert.ok(!items.some(i=>i.id==='winter-coat'));
  const bag=getDefaultBagItems({countryId:'VN',cityId:city,departureDate:`2027-${String(month).padStart(2,'0')}-10`,returnDate:`2027-${String(month).padStart(2,'0')}-15`,travelPurpose:'sightseeing',baggageType:'checked'});
  for(const item of items)assert.ok(bag.some(b=>b.id===item.checklistItemId));assert.equal(new Set(bag.map(i=>i.id)).size,bag.length);
 }
 assert.ok(!getClothingPreview(getClimateMonth('phuquoc',1),'relaxation').some(i=>i.id==='rain-protection'||i.id==='walking-shoes'));
 const segments=getTripClimate('danang','2026-12-29','2027-01-03');assert.deepEqual(segments.map(s=>[s.year,s.month,s.climate.recommendedMetrics.meanTemperatureC.value]),[[2026,12,22.4],[2027,1,21.7]]);
 assert.equal(getClimateMonth('osaka',11).recommendedMetrics.meanTemperatureC.value.toFixed(1),'14.2');assert.equal(getClimateMonth('haiphong',1).recommendedMetrics,null);
 for(const month of [0,13])assert.throws(()=>getClimateMonth('hanoi',month),RangeError);
});
