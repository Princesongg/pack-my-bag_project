import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { getDefaultBagItems, bagStorageKey, restoreBag, loadBag, packingProgress } = await loadTs('src/service/my-bag/bag.ts');
const trip = { countryId:'JP', cityId:'tokyo', departureDate:'2099-11-29', returnDate:'2099-12-02', travelPurpose:'sightseeing', baggageType:'checked', tripDays:4, tripNights:3 };
const items = getDefaultBagItems(trip);
test('packing list reuses clothing IDs, merges cross-month duplicates and supports unresearched destinations', () => {
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.ok(items.some(item => item.id.startsWith('clothing:')));
  assert.ok(items.some(item => item.id === 'essential:passport'));
  const unsupported = getDefaultBagItems({ ...trip, countryId:'TH', cityId:'unknown' });
  assert.ok(!unsupported.some(item => item.id.startsWith('clothing:')));
  assert.equal(new Set(items.map(item => item.categoryId)).size, 5);
});
test('each travel condition scopes storage independently; calculated counts do not change identity', () => {
  const key = bagStorageKey(trip);
  for (const [field, value] of Object.entries({countryId:'VN',cityId:'osaka',departureDate:'2099-11-28',returnDate:'2099-12-03',travelPurpose:'business',baggageType:'cabin-only'})) assert.notEqual(bagStorageKey({...trip,[field]:value}),key);
  assert.equal(bagStorageKey({...trip,tripDays:99}),key);
});
test('restores valid custom items and checks, rejects malformed, duplicate and stale entries', () => {
  const raw = { version:1, checkedIds:[items[0].id,items[0].id,'custom:one','missing'], customItems:[{id:'custom:one',name:'  여행 노트  ',categoryId:'other'},{id:'custom:one',name:'duplicate',categoryId:'other'},{id:items[0].id,name:'overwrite',categoryId:'other'},{id:'custom:bad',name:'invalid',categoryId:'unknown'}] };
  const state = restoreBag(raw,items);
  assert.equal(state.customItems.length,1);
  assert.equal(state.customItems[0].name,'여행 노트');
  assert.deepEqual(state.checkedIds,[items[0].id,'custom:one']);
  const storage = {getItem:key=>key===bagStorageKey(trip)?JSON.stringify(state):null};
  assert.deepEqual(loadBag(storage,bagStorageKey(trip),items),state);
  assert.equal(loadBag(storage,bagStorageKey({...trip,cityId:'osaka'}),items).checkedIds.length,0);
  for(const storage of [{getItem:()=>'{broken'},{getItem:()=>{throw Error('blocked')}}]) assert.equal(loadBag(storage,'key',items).customItems.length,0);
});
test('progress ignores stale checked IDs and duplicates, handles empty and complete lists', () => {
  assert.deepEqual(packingProgress([],['missing']),{total:0,complete:0,percent:0});
  assert.equal(packingProgress(items,[items[0].id,items[0].id,'missing']).complete,1);
  assert.equal(packingProgress(items,items.map(item=>item.id)).percent,100);
});
