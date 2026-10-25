import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {getClimateMonth}=await loadTs('src/service/data/climate.ts');
const {getVisibleClimateMetrics}=await loadTs('src/service/travel-info/climateMetricsModel.ts');

test('partial Vietnam months expose only verified mean/rain without manufacturing high/low',()=>{
  for(const [city,mean,rain] of [['nhatrang',25.1,228.4],['phuquoc',27.1,76.9]]) {
    const entries=getVisibleClimateMetrics(getClimateMonth(city,12));
    assert.deepEqual(entries.map(e=>[e.key,e.metric.value]),[['meanTemperatureC',mean],['precipitationMm',rain]]);
  }
  for(const city of ['osaka','hanoi','danang','taipei']) assert.equal(getVisibleClimateMetrics(getClimateMonth(city,12)).length,4);
});
test('zero rain stays visible; missing, nonfinite and unverified values never become numeric cards',()=>{
  const climate=structuredClone(getClimateMonth('nhatrang',12));
  climate.recommendedMetrics.precipitationMm.value=0;
  assert.equal(getVisibleClimateMetrics(climate)[1].metric.value,0);
  climate.recommendedMetrics.meanTemperatureC.value=NaN;
  assert.equal(getVisibleClimateMetrics(climate).length,1);
  climate.recommendedMetrics.precipitationMm.basis='needs-research';
  assert.deepEqual(getVisibleClimateMetrics(climate),[]);
  assert.deepEqual(getVisibleClimateMetrics(getClimateMonth('haiphong',12)),[]);
});
