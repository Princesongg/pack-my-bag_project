import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {visaRequirements,getVisaRequirement}=await loadTs('src/service/data/visaRequirements.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const base={countryId:'US',cityId:'new-york',departureDate:'2027-01-10',returnDate:'2027-01-15',travelPurpose:'sightseeing',baggageType:'checked'};
test('only US and AU show the visa guide for the requested country defaults',()=>{
  assert.deepEqual(Object.entries(visaRequirements).filter(([,r])=>r.type!=='none').map(([id])=>id),['US','AU']);
  for(const id of ['JP','VN','TH','TW'])assert.equal(getVisaRequirement({...base,countryId:id}).type,'none');
  assert.equal(getVisaRequirement({...base,countryId:'unknown'}),null);
  assert.equal(getVisaRequirement({...base,countryId:'toString'}),null);
});
test('visa-only content preserves conditional exemptions and excludes passport/arrival rules',()=>{
  for(const id of ['US','AU']){const g=getVisaRequirement({...base,countryId:id});assert.equal(g.points.length,3);assert.ok(g.sourceIds.every(id=>getSource(id)));assert.ok(g.sourceIds.every(id=>!id.startsWith('passport-')));assert.doesNotMatch(JSON.stringify(g),/유효기간|만료일|TWAC|TDAC|IPC|PAI|여권을 챙겼/);assert.equal(getVisaRequirement({...base,countryId:id,travelPurpose:'business'}).needsReview,true);}
  assert.match(visaRequirements.US.points.join(' '),/유효한 미국 비자/);assert.match(visaRequirements.AU.points.join(' '),/비자\(subclass 601\)/);
});
