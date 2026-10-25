import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {getClimateMonth}=await loadTs('src/service/data/climate.ts');
const {getClothingPreview,getWeatherPoints,formatClimateBasis}=await loadTs('src/service/travel-info/guideModel.ts');

test('equal years with different observation series cannot create a range or a combined clothing rule',()=>{
  const baseline=getClimateMonth('chiangmai',12);
  assert.ok(getClothingPreview(baseline,'sightseeing').some(i=>i.id==='cardigan'));
  const mixed=structuredClone(baseline);
  mixed.recommendedMetrics.meanDailyMinimumC.comparisonGroup='another-station/1991-2020';
  assert.doesNotMatch(getWeatherPoints(mixed,'sightseeing').observations.join(' '),/差|차이는/);
  assert.ok(!getClothingPreview(mixed,'sightseeing').some(i=>i.ruleId==='layering'));
  // A single observed low and independent rainfall remain usable; no wholesale loss of guidance.
  assert.ok(getClothingPreview(mixed,'sightseeing').some(i=>i.id==='light-long-sleeve'));
  assert.ok(getClothingPreview(getClimateMonth('bangkok',9),'sightseeing').some(i=>i.id==='rain-protection'));
});
test('published WMO values remain available without certifying unresolved period history',()=>{
  for(const city of ['hanoi','danang'])for(let month=1;month<=12;month++){
    const c=getClimateMonth(city,month),m=c.recommendedMetrics;
    assert.match(c.provenance.displayNote,/WMO.*確認|WMO.*확인/);
    assert.match(formatClimateBasis(m.meanDailyMaximumC),/기간 이력 확인 필요/);
    assert.doesNotMatch(formatClimateBasis(m.meanDailyMaximumC),/공식 30년/);
    assert.ok(Number.isFinite(m.meanDailyMaximumC.value));
    if(city==='hanoi')assert.match(formatClimateBasis(m.meanTemperatureC),/계산 참고/);
    else {assert.notEqual(m.meanTemperatureC.comparisonGroup,m.meanDailyMaximumC.comparisonGroup);assert.match(formatClimateBasis(m.meanTemperatureC),/공식 30년/);}
  }
  for(const city of ['tokyo','taipei','new-york','sydney'])assert.doesNotMatch(formatClimateBasis(getClimateMonth(city,1).recommendedMetrics.meanTemperatureC),/기간 이력 확인 필요/);
});
