import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { restoreLastMinute, lastMinuteProgress } = await loadTs('src/service/my-bag/lastMinuteModel.ts');
const { basicBagItems, restoreBag, packingProgress, bagStorageKey } = await loadTs('src/service/my-bag/bag.ts');
test('defaults reference existing IDs only and never inherit normal checks', () => {
  const state = restoreLastMinute(undefined, basicBagItems);
  assert.equal(state.itemIds.length,4);
  assert.deepEqual(state.checkedIds,[]);
  assert.deepEqual(restoreLastMinute(undefined,[]),{itemIds:[],checkedIds:[]});
  assert.equal(lastMinuteProgress(state).percent,0);
});
test('restores custom selection, empty selection, and rejects stale/duplicate IDs', () => {
  const custom={id:'custom:test',name:'Test',categoryId:'other',custom:true};
  const state=restoreLastMinute({itemIds:['custom:test','custom:test','missing'],checkedIds:['custom:test','missing']},[...basicBagItems,custom]);
  assert.deepEqual(state,{itemIds:['custom:test'],checkedIds:['custom:test']});
  assert.equal(lastMinuteProgress(state).allDone,true);
  assert.deepEqual(restoreLastMinute(state,basicBagItems),{itemIds:[],checkedIds:[]});
  assert.equal(lastMinuteProgress(restoreLastMinute({itemIds:[],checkedIds:[]},basicBagItems)).allDone,false);
});
test('bag storage round trip preserves independent checks and other feature states', () => {
  const bag={version:1,checkedIds:['essential:passport'],customItems:[],redFlagCheckedIds:['passport:expiry'],lastMinute:{itemIds:['electronic:phone'],checkedIds:['electronic:phone']}};
  const restored=restoreBag(JSON.parse(JSON.stringify(bag)),basicBagItems);
  assert.deepEqual(restored,bag);
  const before=packingProgress(basicBagItems,restored.checkedIds);
  restored.lastMinute.checkedIds=[];
  assert.deepEqual(packingProgress(basicBagItems,restored.checkedIds),before);
  assert.deepEqual(restored.redFlagCheckedIds,['passport:expiry']);
  assert.notEqual(bagStorageKey({cityId:'tokyo'}),bagStorageKey({cityId:'osaka'}));
});
