import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {getEntryPreparation,entryPreparationStatus}=await loadTs('src/service/data/entryPreparation.ts');
const {bagStorageKey,restoreBag,getDefaultBagItems}=await loadTs('src/service/my-bag/bag.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const base={countryId:'US',cityId:'new-york',departureDate:'2027-01-10',returnDate:'2027-01-15',travelPurpose:'sightseeing',baggageType:'checked'};

test('ESTA and ETA retain different legal descriptions, official destinations and conditional guidance',()=>{
  const us=getEntryPreparation(base),au=getEntryPreparation({...base,countryId:'AU',cityId:'sydney'});
  assert.match(us.title,/ESTA/);assert.match(us.details.join(' '),/비자가 아니라/);assert.match(us.details.join(' '),/유효한 미국 비자/);assert.match(us.details.join(' '),/입국을 보장하지/);
  assert.equal(us.links[0].url,'https://esta.cbp.dhs.gov/');
  assert.match(au.title,/ETA/);assert.match(au.details.join(' '),/비자\(subclass 601\)/);assert.match(au.details.join(' '),/Australian ETA App/);assert.match(au.details.join(' '),/수수료/);
  assert.ok(au.links[0].url.endsWith('electronic-travel-authority-601'));
  assert.equal(us.needsReview,false);assert.equal(au.needsReview,true);
  for(const guide of [us,au]){assert.ok(guide.sourceIds.every(id=>getSource(id)));assert.doesNotMatch(guide.details.join(' '),/무료 신청|승인 완료/);}
  assert.equal(getSource('entry-au-eta-601').status,'partially-verified');
  assert.equal(getSource('entry-au-eta-601').lastVerified,null);
  assert.equal(getEntryPreparation({...base,travelPurpose:'business'}).needsReview,true);
  assert.equal(getEntryPreparation({...base,returnDate:'2027-05-01'}).needsReview,true);
});
test('unresolved entry conditions stay unresolved after self-confirmation and existing country requirements are reused',()=>{
  assert.equal(entryPreparationStatus(false,false).label,'확인 필요');
  assert.equal(entryPreparationStatus(false,true).label,'직접 확인함');
  for(const countryId of ['VN','TH','TW']){const g=getEntryPreparation({...base,countryId});assert.equal(g.needsReview,countryId!=='TW');assert.equal(entryPreparationStatus(g.needsReview,true).label,countryId==='TW'?'직접 확인함':'추가 확인 필요');assert.doesNotMatch(g.body,/비자 필요/);assert.match(g.passportRequirement,/6개월/);assert.ok(g.links.every(l=>l.url.startsWith('https://')));}
  const jp=getEntryPreparation({...base,countryId:'JP'});assert.equal(jp.needsReview,false);assert.match(jp.details.join(' '),/90일/);assert.match(jp.details.join(' '),/모든 여행자에게 필수라고 단정하지/);
  assert.equal(getEntryPreparation({...base,countryId:'JP',returnDate:'2027-05-01'}).needsReview,true);
  assert.equal(getEntryPreparation({...base,countryId:'unknown'}),null);
});
test('only a personal boolean is restored per trip, without replacing packing checks or creating visa items',()=>{
  const items=getDefaultBagItems(base),saved={version:1,checkedIds:['essential:passport','electronic:charger'],customItems:[],entryPreparationConfirmed:true,visaNumber:'discard',approval:'approved'};
  const restored=restoreBag(saved,items);assert.equal(restored.entryPreparationConfirmed,true);for(const id of saved.checkedIds)assert.ok(restored.checkedIds.includes(id));assert.ok(restored.checkedIds.includes('essential:entry-authorization'));assert.ok(!('visaNumber'in restored));assert.ok(!('approval'in restored));
  assert.equal(items.filter(i=>i.id==='essential:passport').length,1);assert.equal(new Set(items.map(i=>i.id)).size,items.length);
  for(const entryPreparationConfirmed of ['approved',{},1,false])assert.ok(!restoreBag({...saved,entryPreparationConfirmed},items).entryPreparationConfirmed);
  assert.ok(!restoreBag({version:1,checkedIds:saved.checkedIds,customItems:[]},items).entryPreparationConfirmed);
  const key=bagStorageKey(base);for(const patch of [{cityId:'los-angeles'},{countryId:'AU',cityId:'sydney'},{departureDate:'2027-01-11'},{travelPurpose:'business'}])assert.notEqual(bagStorageKey({...base,...patch}),key);
});
