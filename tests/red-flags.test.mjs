import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { redFlagGroups, redFlagProgress, restoreRedFlagChecks } = await loadTs('src/service/my-bag/redFlagsModel.ts');
const { restoreBag, basicBagItems, packingProgress, bagStorageKey, loadBag } = await loadTs('src/service/my-bag/bag.ts');

test('only fully acknowledged groups are complete, invalid and duplicate checks are discarded', () => {
  const ids=redFlagGroups.flatMap(group=>group.items.map(item=>item.id));
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(redFlagProgress(ids).filter(group=>group.complete).length,3);
  assert.equal(redFlagProgress(['passport:expiry']).filter(group=>group.complete).length,0);
  assert.deepEqual(restoreRedFlagChecks(['passport:expiry','passport:expiry','invalid',true]),['passport:expiry']);
  assert.deepEqual(restoreRedFlagChecks({}),[]);
});
test('red flag storage is independent of packing progress and rejects sensitive fields', () => {
  const checks=['payment:block','passport:expiry'];
  const raw={version:1,checkedIds:['essential:passport'],customItems:[],redFlagCheckedIds:checks,passportExpiry:'2030-01-01',cardNumber:'must-not-survive',packLess:{answers:{accommodationAmenities:'unknown',laundryPlan:'no',shoppingPlan:'no'},decisions:{}}};
  const state=restoreBag(raw,basicBagItems);
  assert.deepEqual(state.redFlagCheckedIds,checks);
  assert.deepEqual(state.checkedIds,['essential:passport']);
  assert.ok(!JSON.stringify(state).includes('2030-01-01'));
  assert.ok(!JSON.stringify(state).includes('must-not-survive'));
  assert.equal(packingProgress(basicBagItems,state.checkedIds).complete,1);
  assert.ok(state.packLess);
  assert.equal(restoreBag({version:1,checkedIds:[],customItems:[]},basicBagItems).redFlagCheckedIds,undefined);
});
test('travel-scoped storage restores checks only for the matching trip', () => {
  const trip={countryId:'JP',cityId:'tokyo',departureDate:'2099-11-29',returnDate:'2099-12-02',travelPurpose:'sightseeing',baggageType:'checked'};
  const key=bagStorageKey(trip);
  const storage={getItem:k=>k===key?JSON.stringify({version:1,checkedIds:[],customItems:[],redFlagCheckedIds:['payment:block']}):null};
  assert.deepEqual(loadBag(storage,key,basicBagItems).redFlagCheckedIds,['payment:block']);
  assert.equal(loadBag(storage,bagStorageKey({...trip,cityId:'osaka'}),basicBagItems).redFlagCheckedIds,undefined);
});
