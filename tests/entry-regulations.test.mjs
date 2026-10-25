import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {getEntryRegulation,entryRegulations}=await loadTs('src/service/data/entryRegulations.ts');
const {getDefaultBagItems,restoreBag}=await loadTs('src/service/my-bag/bag.ts');
const {applyEntryCheck,entryItemIds,entryFlagIds}=await loadTs('src/service/my-bag/entryChecks.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const base={countryId:'US',cityId:'new-york',departureDate:'2027-01-01',returnDate:'2027-01-05',travelPurpose:'sightseeing',baggageType:'checked'};
test('country procedures distinguish TWAC7 days, TDAC3 days, optional VN pilot and AU phased rollout',()=>{
  assert.match(entryRegulations.TW.arrival,/7일/);assert.match(entryRegulations.TW.arrival,/2026-07-15/);
  assert.match(entryRegulations.TH.arrival,/입국일 포함3일/);assert.equal(entryRegulations.TH.maximumDays,undefined);assert.ok(getEntryRegulation({...base,countryId:'TH'}).needsReview);
  assert.match(entryRegulations.VN.arrival,/탄손누트공항/);assert.match(entryRegulations.VN.arrival,/선택적 시범/);assert.ok(getEntryRegulation({...base,countryId:'VN'}).needsReview);
  assert.match(entryRegulations.AU.arrival,/모든 여행자.*전면 시행됐다고 안내하지/);
  assert.equal(entryRegulations.JP.dates[0].effectiveFrom,null);
  for(const entry of Object.values(entryRegulations))for(const id of entry.sourceIds)assert.ok(getSource(id),id);
});
test('verified date windows and Taiwanese next-day counting never invent future visa eligibility',()=>{
  const tw=getEntryRegulation({...base,countryId:'TW',departureDate:'2027-01-01',returnDate:'2027-04-01'});assert.equal(tw.days,90);assert.equal(tw.outOfScope,false);
  assert.equal(getEntryRegulation({...base,countryId:'TW',returnDate:'2027-04-02'}).outOfScope,true);
  assert.equal(getEntryRegulation({...base,countryId:'VN',departureDate:'2028-03-15',returnDate:'2028-03-18'}).outOfScope,true);
  assert.equal(getEntryRegulation({...base,countryId:'VN',returnDate:'2027-02-14'}).outOfScope,false);
  assert.equal(getEntryRegulation({...base,countryId:'VN',returnDate:'2027-02-15'}).outOfScope,true);
});
test('entry self-checks share IDs across modal, red flags and packing while preserving older fields',()=>{
  const items=getDefaultBagItems(base),old={version:1,checkedIds:['essential:passport','electronic:charger'],customItems:[],entryPreparationConfirmed:true,redFlagCheckedIds:['passport:name']};
  let state=restoreBag(old,items);assert.ok(state.checkedIds.includes(entryItemIds.authorization));assert.ok(state.redFlagCheckedIds.includes(entryFlagIds.authorization));assert.ok(state.redFlagCheckedIds.includes('passport:name'));
  state=applyEntryCheck(state,items,'procedure',true);assert.ok(state.checkedIds.includes(entryItemIds.procedure));assert.ok(state.redFlagCheckedIds.includes(entryFlagIds.procedure));
  state=applyEntryCheck(state,items,'authorization',false);assert.equal(state.entryPreparationConfirmed,false);assert.ok(!state.checkedIds.includes(entryItemIds.authorization));assert.ok(!state.redFlagCheckedIds.includes(entryFlagIds.authorization));
  assert.ok(state.checkedIds.includes('essential:passport'));assert.ok(state.checkedIds.includes('electronic:charger'));assert.equal(restoreBag(JSON.parse(JSON.stringify(state)),items).entryPreparationConfirmed,undefined);
});
test('existing custom visa and arrival items are reused without losing their IDs or checked state',()=>{
  const customs=[{id:'custom:visa',name:'ESTA 또는 비자 확인',categoryId:'essentials',custom:true},{id:'custom:twac',name:'입국신고 확인',categoryId:'essentials',custom:true}];
  const defaults=getDefaultBagItems(base,customs);assert.ok(!defaults.some(i=>i.id===entryItemIds.authorization||i.id===entryItemIds.procedure));
  const state=restoreBag({version:1,checkedIds:['custom:visa','custom:twac'],customItems:customs},defaults);assert.ok(state.entryPreparationConfirmed);assert.ok(state.checkedIds.includes('custom:visa'));assert.ok(state.redFlagCheckedIds.includes(entryFlagIds.procedure));
  const combined={id:'custom:both',name:'비자 및 입국신고 확인',categoryId:'essentials',custom:true};const rows=[...getDefaultBagItems(base,[combined]),combined];let s=applyEntryCheck({version:1,checkedIds:[],customItems:[combined]},rows,'authorization',true);assert.ok(s.redFlagCheckedIds.includes(entryFlagIds.procedure));s=applyEntryCheck(s,rows,'procedure',false);assert.equal(s.entryPreparationConfirmed,false);
});
