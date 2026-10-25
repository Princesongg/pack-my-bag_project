import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {assessPassport,addCalendarMonths}=await loadTs('src/service/my-bag/passportModel.ts');
const {getPassportRule}=await loadTs('src/service/data/passportRules.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const confirmed={scopeConfirmed:true,route:'direct'};
const check=(country,expiry,context=confirmed,start='2026-12-17',end='2026-12-20')=>assessPassport(country,start,end,expiry,context);

test('the supplied December trip passes stay-validity countries and fails six-month countries',()=>{
  for(const country of ['VN','TH','TW']) {
    const r=check(country,'2027-04-25');assert.equal(r.status,'failed');assert.equal(r.requiredExpiry,'2027-06-17');assert.match(r.action,/갱신/);
    assert.equal(check(country,'2027-06-16').status,'failed');
    assert.equal(check(country,'2027-06-17').status,'met');
    assert.equal(check(country,'2027-06-18').status,'met');
  }
  for(const country of ['JP','US','AU']) {
    assert.equal(check(country,'2027-04-25').status,'met');assert.equal(check(country,'2026-12-20').status,'met');
    assert.equal(check(country,'2026-12-19').status,'failed');assert.equal(check(country,'2026-12-16').status,'failed');
    assert.equal(check(country,'2026-12-20').requiredExpiry,'2026-12-20');
  }
  assert.match(getPassportRule('US').requirement,/면제/);assert.match(getPassportRule('US').extra,/ESTA/);assert.match(getPassportRule('AU').extra,/ETA/);
});
test('calendar months clamp month ends and preserve leap years rather than adding 180 days',()=>{
  for(const [from,to] of [['2026-08-31','2027-02-28'],['2027-08-31','2028-02-29'],['2028-02-29','2028-08-29'],['2026-12-17','2027-06-17'],['2026-03-31','2026-09-30']])assert.equal(addCalendarMonths(from,6),to);
  assert.equal(addCalendarMonths('2026-02-29',6),null);assert.equal(addCalendarMonths('9999-12-31',6),null);
  assert.equal(addCalendarMonths('invalid',6),null);assert.equal(addCalendarMonths('2026-12-17',1.5),null);
  assert.equal(check('TW','2027-02-27',confirmed,'2026-08-31','2026-09-05').status,'failed');
  assert.equal(check('TW','2027-02-28',confirmed,'2026-08-31','2026-09-05').status,'met');
  // Even a long stay must not outlast the passport after the six-month entry threshold.
  assert.equal(check('TW','2027-06-17',confirmed,'2026-12-17','2027-07-01').status,'failed');
});
test('unknown scope, route, country, invalid dates and out-of-scope visa periods never pass',()=>{
  for(const country of ['JP','US','AU','TW','TH','VN']) {
    assert.equal(check(country,'2027-09-01',{scopeConfirmed:false,route:'direct'}).status,'review');
    assert.equal(check(country,'2027-09-01',{scopeConfirmed:true,route:'unknown'}).status,'review');
    assert.equal(check(country,'2027-09-01',{scopeConfirmed:true,route:'checked'}).status,'met');
    assert.equal(check(country,'').status,'review');assert.equal(check(country,'2027-02-30').status,'review');
  }
  for(const country of ['unknown','toString','Taiwan'])assert.equal(check(country,'2027-09-01').status,'review');
  assert.equal(check('JP','2027-09-01',confirmed,'2026-12-20','2026-12-17').status,'review');
  assert.equal(check('JP','2027-09-01',confirmed,'bad','2026-12-20').status,'review');
  assert.equal(check('VN','2030-01-01',confirmed,'2028-03-15','2028-03-18').status,'review');
  assert.equal(check('VN','2028-01-01',confirmed,'2026-12-17','2027-03-01').status,'review');
});
test('missing or unverified official evidence fails closed and links remain country-specific',()=>{
  for(const country of ['JP','VN','TH','TW','US','AU']){
    const rule=getPassportRule(country);for(const id of rule.sourceIds){const s=getSource(id);assert.equal(s.lastVerified,'2026-10-25');assert.equal(s.status,'verified');assert.ok(s.url.startsWith('https://'));}
    const s=getSource(rule.sourceIds[0]),status=s.status,date=s.lastVerified;
    try{s.status='needs-research';assert.equal(check(country,'2027-09-01').status,'review');s.status=status;s.lastVerified=null;assert.equal(check(country,'2027-09-01').status,'review');}finally{s.status=status;s.lastVerified=date;}
  }
  assert.equal(getSource('passport-us-cbp').status,'needs-research');
});
