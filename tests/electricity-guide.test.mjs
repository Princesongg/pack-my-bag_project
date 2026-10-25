import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {destinations}=await loadTs('src/service/destination/destinations.ts');
const {getElectricityGuide,getElectricityPreparation}=await loadTs('src/service/data/electricityGuide.ts');
const {getDefaultBagItems,restoreBag,withElectricityRecommendation}=await loadTs('src/service/my-bag/bag.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const {getCountryElectricity}=await loadTs('src/service/data/electricity.ts');
const {getCountryPlugVisuals,plugVisuals}=await loadTs('src/service/data/plugVisuals.ts');
const expected={JP:'100V · 50 / 60Hz',VN:'220V · 50Hz',TH:'220V · 50Hz',TW:'110V · 60Hz',US:'110–120V · 60Hz',AU:'220–240V · 50Hz'};

test('Thai C/O summary uses primary official evidence and treats A/B/F as facility-specific compatibility',()=>{
 const e=getCountryElectricity('TH'),guide=getElectricityGuide('TH');
 assert.deepEqual(e.voltageV.value,[220]);assert.deepEqual(e.frequencyHz.value,[50]);assert.deepEqual(e.plugTypeIds.value,['C','O']);assert.deepEqual(e.otherPlugTypes.value,['A','B','F']);
 assert.deepEqual(getCountryPlugVisuals('TH'),e.plugTypeIds.value);assert.equal(guide.typeSummary,'Type C / O');assert.equal(plugVisuals.O.grounded,true);assert.match(plugVisuals.O.description,/전원 핀 2개.*접지 핀 1개/);
 for(const id of e.plugTypeIds.sourceIds){assert.ok(['th-qsncc-electricity','th-am2026-electricity'].includes(id));assert.equal(getSource(id).status,'verified');assert.equal(getSource(id).lastVerified,'2026-10-25');}
 assert.match(guide.shapes,/숙소마다/);assert.match(guide.details.join(' '),/Type A\/B/);assert.match(guide.details.join(' '),/Type F/);assert.match(guide.details.join(' '),/접지가 유지/);
 for(const [country,kinds] of [['JP',['A']],['VN',['C','A']],['TW',['A','B']],['US',['A','B']],['AU',['I2','I3']]])assert.deepEqual(getCountryPlugVisuals(country),kinds);
});
test('six countries and all 17 cities share coherent preparation IDs, names, statuses and reasons',()=>{
 let count=0;
 for(const country of destinations){
  const guide=getElectricityGuide(country.id);assert.equal(guide.main,expected[country.id]);assert.equal(guide.verified,true);
  assert.equal(guide.preparation[0].status,'챙기기');
  assert.equal(guide.preparation[0].reason,country.id === 'TH' ? '평소 사용하는 충전기를 챙기고 입력 전압과 주파수를 확인해 주세요.' : '가져가는 기기의 충전기와 케이블을 챙겨주세요. 충전기의 입력 전압과 주파수도 확인해 주세요.');
  assert.ok(guide.compatibility.includes(country.id === 'VN' ? '충전기에 INPUT 100–240V · 50/60Hz라고 적혀 있다면' : country.id === 'TH' ? '충전기에 INPUT 100–240V · 50/60Hz라고 적혀 있다면' : '내 제품에 실제로 적혀 있을 때만'));assert.ok(!guide.preparation.some(i=>i.status==='필수'));
  assert.ok(guide.cautions[0].includes('전압·주파수'));
  assert.ok(guide.sourceIds.length);for(const id of guide.sourceIds){assert.equal(getSource(id).status,'verified');assert.ok(getSource(id).lastVerified);if(country.id!=='JP')assert.ok(!id.startsWith('jnto-'));}
  for(const city of country.cities){count++;const trip={countryId:country.id,cityId:city.id,departureDate:'2027-11-10',returnDate:'2027-11-15',travelPurpose:'sightseeing',baggageType:'checked'};
   const items=getDefaultBagItems(trip);assert.equal(items.length,new Set(items.map(i=>i.id)).size);
   for(const p of getElectricityPreparation(country.id)){const item=items.find(i=>i.id===p.id);assert.ok(item);assert.equal(item.name,p.name);assert.equal(item.note,p.reason);assert.equal(item.recommendationStatus,p.status);}
   const old={id:'custom:adapter',name:'돼지코',categoryId:'electronics'};const defaults=getDefaultBagItems(trip,[old]);assert.ok(!defaults.some(i=>i.id==='electronic:travel-adapter'));
   const restored=restoreBag({version:1,customItems:[old],checkedIds:[old.id,'essential:passport']},defaults);assert.ok(restored.checkedIds.includes(old.id));assert.ok(restored.checkedIds.includes('essential:passport'));
   const display=withElectricityRecommendation(restored.customItems[0],country.id);assert.equal(display.id,old.id);assert.equal(display.name,guide.preparation[1].name);assert.equal(display.recommendationStatus,guide.preparation[1].status);
  }
 }
 assert.equal(count,17);assert.equal(getElectricityGuide('TH').preparation[1].status,'준비 권장');
});
test('unverified, missing or undated sources cannot certify facts or create recommendations',()=>{
 for(const id of ['unknown','toString','Taiwan']){assert.equal(getElectricityGuide(id),null);assert.deepEqual(getElectricityPreparation(id),[]);}
 const source=getSource('th-tat-electricity'),status=source.status,date=source.lastVerified;
 try{source.status='needs-research';assert.equal(getElectricityGuide('TH').verified,false);assert.deepEqual(getElectricityPreparation('TH'),[]);source.status='verified';source.lastVerified=null;assert.equal(getElectricityGuide('TH').verified,false);}finally{source.status=status;source.lastVerified=date;}
});
