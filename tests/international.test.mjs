import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { getInternationalProfile, getTripTimeOffsets } = await loadTs('src/service/data/international.ts');
const { getClimateMonth } = await loadTs('src/service/data/climate.ts');
const { getDefaultBagItems, bagStorageKey } = await loadTs('src/service/my-bag/bag.ts');
const { getSource } = await loadTs('src/service/data/sources.ts');
test('new countries expose sourced facts, US normals, and Australian all-record statistics',()=>{
  for(const [countryId,cityIds] of [['US',['new-york','los-angeles']],['AU',['sydney','melbourne']]]){
    const profile=getInternationalProfile(countryId);
    assert.equal(profile.climate.status,'verified');
    for(const field of ['electricity','currency','entry']){
      assert.equal(profile[field].status,'verified');
      for(const source of profile[field].sourceIds) assert.equal(getSource(source).status,'verified');
    }
    for(const cityId of cityIds){
      assert.ok(getClimateMonth(cityId,1).recommendedMetrics);
      const trip={countryId,cityId,departureDate:'2027-01-10',returnDate:'2027-01-14',travelPurpose:'sightseeing',baggageType:'checked'};
      const items=getDefaultBagItems(trip);
      assert.equal(new Set(items.map(i=>i.id)).size,items.length);
      assert.ok(items.some(i=>i.id.startsWith('clothing:')));
      assert.ok(items.some(i=>i.id==='essential:passport'));
      assert.ok(bagStorageKey(trip).includes(cityId));
    }
  }
});
test('city offsets depend on season, hemisphere and date; intervals crossing DST expose both offsets',()=>{
  assert.deepEqual(getTripTimeOffsets('new-york','2026-01-10','2026-01-12').utcOffsetMinutes,[-300]);
  assert.deepEqual(getTripTimeOffsets('new-york','2026-07-10','2026-07-12').utcOffsetMinutes,[-240]);
  assert.deepEqual(getTripTimeOffsets('los-angeles','2026-01-10','2026-01-12').utcOffsetMinutes,[-480]);
  assert.deepEqual(getTripTimeOffsets('los-angeles','2026-07-10','2026-07-12').utcOffsetMinutes,[-420]);
  for(const city of ['sydney','melbourne']){
    assert.deepEqual(getTripTimeOffsets(city,'2026-01-10','2026-01-12').utcOffsetMinutes,[660]);
    assert.deepEqual(getTripTimeOffsets(city,'2026-07-10','2026-07-12').utcOffsetMinutes,[600]);
  }
  assert.deepEqual(getTripTimeOffsets('new-york','2026-10-30','2026-11-03').differenceFromKoreaMinutes,[-840,-780]);
  assert.deepEqual(getTripTimeOffsets('sydney','2026-10-01','2026-10-06').differenceFromKoreaMinutes,[60,120]);
  assert.equal(getTripTimeOffsets('unknown','2026-01-10','2026-01-12'),null);
  assert.equal(getTripTimeOffsets('sydney','invalid','2026-01-12'),null);
});
