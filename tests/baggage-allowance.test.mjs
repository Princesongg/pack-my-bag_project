import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { restoreBaggageAllowance: restore, allowanceLabel } = await loadTs('src/service/my-bag/baggageAllowance.ts');
const base = { source: 'user-confirmed-ticket', confirmed: true, airline: '', system: 'pieces', pieces: 1, kgPerPiece: 15 };
test('only valid explicitly confirmed ticket records are restored', () => {
  assert.deepEqual(restore(base), base);
  for (const bad of [null, {}, {...base, confirmed:false}, {...base, pieces:-1}, {...base,pieces:1.5}, {...base,kgPerPiece:0}, {...base,kgPerPiece:Infinity}]) assert.equal(restore(bad),undefined);
  assert.equal(allowanceLabel(), '허용량 확인 필요');
});
test('zero pieces needs no weight and total weight is a distinct system', () => {
  assert.deepEqual(restore({...base,pieces:0,kgPerPiece:null}),{...base,pieces:0,kgPerPiece:null});
  assert.equal(allowanceLabel(restore({...base,pieces:0})), '무료 위탁 · 0개 (무료 허용 없음)');
  const total={source:base.source,confirmed:true,airline:' Airline ',system:'total-weight',totalKg:20};
  assert.deepEqual(restore(total),{...total,airline:'Airline'});
  assert.equal(allowanceLabel(restore(total)), '무료 위탁 · 총 20kg (합산)');
});

const { restoreBag, basicBagItems, bagStorageKey } = await loadTs('src/service/my-bag/bag.ts');
test('bag round trip preserves checklist and allowance without sharing trip keys', () => {
 const bag={version:1,checkedIds:['essential:passport'],customItems:[],baggageAllowance:base,redFlagCheckedIds:['baggage:free-allowance']};
 assert.deepEqual(restoreBag(JSON.parse(JSON.stringify(bag)),basicBagItems),bag);
 assert.equal(restoreBag({...bag,baggageAllowance:{...base,confirmed:false}},basicBagItems).baggageAllowance,undefined);
 assert.notEqual(bagStorageKey({cityId:'tokyo'}),bagStorageKey({cityId:'osaka'}));
});
