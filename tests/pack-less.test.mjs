import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const model = await loadTs('src/service/my-bag/packLessModel.ts');
const { basicBagItems, restoreBag, packingProgress, bagStorageKey } = await loadTs('src/service/my-bag/bag.ts');
const answers = { accommodationAmenities:'yes',laundryPlan:'yes',shoppingPlan:'yes' };
const items = [...basicBagItems,{id:'custom:charger',name:'충전기 · 케이블',categoryId:'electronics',custom:true},{id:'custom:med',name:'감기약',categoryId:'other',custom:true}];
test('amenities are item-specific review, not automatic exclusion; no laundry date means no generated quantities',()=>{
 const suggestions=model.getPackingSuggestions(items,answers,5);
 assert.ok(suggestions.filter(s=>s.item.categoryId==='toiletries').every(s=>s.group==='review'));
 assert.match(suggestions.find(s=>s.item.id==='toiletry:cleanser').reason,/품목.*확인/);
 assert.match(suggestions.find(s=>s.item.id==='basic:underwear').reason,/5일.*자동으로 줄이지 않습니다/);
 assert.ok(suggestions.every(s=>!('quantity' in s)));
 assert.equal(model.getPackingSuggestions(items,{...answers,laundryPlan:'no'},5).find(s=>s.item.id==='basic:underwear').group,'keep');
 assert.equal(model.getPackingSuggestions(items,answers,1).find(s=>s.item.id==='basic:underwear').group,'keep');
 assert.equal(model.getPackingSuggestions(items,{...answers,accommodationAmenities:'no'},5).find(s=>s.item.id==='toiletry:cleanser').group,'keep');
});
test('important items remain protected and exact-name duplicates are only suggestions',()=>{
 const suggestions=model.getPackingSuggestions(items,answers,5);
 for(const id of ['essential:passport','other:medicine','custom:med']) assert.equal(suggestions.find(s=>s.item.id===id).protected,true);
 assert.equal(suggestions.find(s=>s.item.id==='custom:charger').group,'reduce');
 const decisions=model.sanitizeDecisions({'essential:passport':{action:'exclude'},'other:medicine':{action:'reduce',quantity:1},'custom:med':{action:'exclude'},'toiletry:cleanser':{action:'exclude'},unknown:{action:'exclude'}},items);
 assert.deepEqual(Object.keys(decisions),['toiletry:cleanser']);
 assert.ok(model.visibleBagItems(items,{'essential:passport':{action:'exclude'}}).some(i=>i.id==='essential:passport'));
});
test('restores legacy bags and validates packing answers, decisions and persistent undo',()=>{
 const checkedIds=['toiletry:cleanser','basic:underwear'];
 const legacy=restoreBag({version:1,customItems:[],checkedIds},items);
 assert.equal(legacy.packLess,undefined);
 const saved={...legacy,packLess:{answers,decisions:{'toiletry:cleanser':{action:'exclude'},'basic:underwear':{action:'reduce',quantity:2}},previous:{answers:model.emptyPackLessAnswers,decisions:{}}}};
 const restored=restoreBag(JSON.parse(JSON.stringify(saved)),items);
 assert.deepEqual(restored,saved);
 const visible=model.visibleBagItems(items,restored.packLess.decisions);
 assert.equal(visible.length,items.length-1);
 assert.deepEqual(restored.checkedIds,checkedIds);
 assert.equal(packingProgress(visible,checkedIds).complete,1);
 assert.equal(packingProgress(items,checkedIds).complete,2);
 assert.deepEqual(model.restorePackLess({answers:{laundryPlan:'maybe'},decisions:{'basic:underwear':{action:'reduce',quantity:0}}},items),{answers:model.emptyPackLessAnswers,decisions:{}});
 for(const quantity of [-1,0,1.5,NaN,1000,'2']) assert.deepEqual(model.sanitizeDecisions({'basic:underwear':{action:'reduce',quantity}},items),{});
});
test('answer changes preserve explicit choices; no settings leak into a different trip key',()=>{
 const old={answers,decisions:{'toiletry:cleanser':{action:'exclude'}}};
 const changed=model.restorePackLess({...old,answers:{...answers,accommodationAmenities:'no'}},items);
 assert.equal(changed.decisions['toiletry:cleanser'].action,'exclude');
 const trip={countryId:'JP',cityId:'tokyo',departureDate:'2099-11-29',returnDate:'2099-12-02',travelPurpose:'sightseeing',baggageType:'checked'};
 assert.notEqual(bagStorageKey(trip),bagStorageKey({...trip,cityId:'osaka'}));
 assert.equal(model.answersComplete(model.emptyPackLessAnswers),false);
 assert.equal(model.answersComplete(answers),true);
});
