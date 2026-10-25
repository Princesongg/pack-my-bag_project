import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './helpers/load-ts.mjs';
const {getCountryElectricity,getElectricityBrief,vietnamAdapterItem}=await loadTs('src/service/data/electricity.ts');
const {getCountryPlugVisuals,getElectricitySourceIds}=await loadTs('src/service/data/plugVisuals.ts');
const {getDefaultBagItems,restoreBag,bagStorageKey}=await loadTs('src/service/my-bag/bag.ts');
const {visibleBagItems}=await loadTs('src/service/my-bag/packLessModel.ts');
const {getSource}=await loadTs('src/service/data/sources.ts');
const {getElectricityGuide,vietnamUsageCopy}=await loadTs('src/service/data/electricityGuide.ts');
test('all Vietnam cities use the same 220V/50Hz data with C/A first and Vietnam-specific sources',()=>{
 for(const cityId of ['hanoi','danang','nhatrang','phuquoc']){
  const e=getCountryElectricity('VN');assert.deepEqual(e.voltageV.value,[220]);assert.deepEqual(e.frequencyHz.value,[50]);assert.deepEqual(e.plugTypeIds.value,['C','A']);assert.deepEqual(e.otherPlugTypes.value,['D','F']);
  assert.equal(getElectricityBrief('VN').main,'220V · 50Hz');assert.deepEqual(getCountryPlugVisuals('VN'),['C','A']);
  const trip={countryId:'VN',cityId,departureDate:'2027-11-10',returnDate:'2027-11-15',travelPurpose:'sightseeing',baggageType:'checked'};
  const items=getDefaultBagItems(trip),adapters=items.filter(i=>i.id===vietnamAdapterItem.id);assert.equal(adapters.length,1);assert.equal(adapters[0].categoryId,'electronics');assert.equal(adapters[0].recommendation,'electricity');assert.equal(adapters[0].note,vietnamAdapterItem.reason);
  const restored=restoreBag({version:1,checkedIds:['essential:passport',vietnamAdapterItem.id],customItems:[],packLess:{answers:{accommodationAmenities:'unknown',laundryPlan:'no',shoppingPlan:'no'},decisions:{[vietnamAdapterItem.id]:{action:'exclude'}}}},items);
  assert.ok(restored.checkedIds.includes('essential:passport'));assert.ok(restored.checkedIds.includes(vietnamAdapterItem.id));assert.ok(!visibleBagItems(items,restored.packLess.decisions).some(i=>i.id===vietnamAdapterItem.id));
  assert.ok(bagStorageKey(trip).startsWith('pack-my-bag.bag.v1:'));
 }
 for(const id of getElectricitySourceIds('VN')){assert.equal(getSource(id).lastVerified,'2026-10-25');assert.ok(!getSource(id).organization.includes('JNTO'));}
});
test('Vietnam usage guidance is conditional and adapters do not replace voltage, frequency or earth checks',()=>{
 const e=getCountryElectricity('VN'),guide=getElectricityGuide('VN'),text=[guide.compatibility,...guide.details,...guide.cautions,...Object.values(vietnamUsageCopy)].join(' ');
 for(const part of ['INPUT 100–240V · 50/60Hz','220V·60Hz 전용','허용 전력','Type F','Type C','제조사 안내','과열','차단기 작동','기기 손상','헐거우면'])assert.ok(text.includes(part),part);
 assert.deepEqual(guide.preparation.map(p=>p.name),['충전기 · 케이블','여행용 변환 어댑터(돼지코)','드라이어·고데기']);
 assert.equal(guide.preparation[0].status,'챙기기');
 assert.equal(guide.preparation[2].id,undefined); // An optional appliance is not automatically added to MY BAG.
 assert.equal(guide.preparation[1].notes.length,3);
 assert.match(e.deviceCaution.text,/전압·주파수를 바꾸지/);assert.match(e.deviceCaution.text,/접지가 유지되는/);assert.ok(guide.preparation.every(p=>p.status!=='필수'));
 for(const countryId of ['JP','TW','US','AU']){const items=getDefaultBagItems({countryId,cityId:countryId==='JP'?'osaka':countryId==='TW'?'taipei':countryId==='US'?'new-york':'sydney',departureDate:'2027-11-10',returnDate:'2027-11-15',travelPurpose:'sightseeing',baggageType:'checked'});assert.equal(items.filter(i=>i.id===vietnamAdapterItem.id).length,1);}
});

test('a saved custom adapter is reused without changing its ID, checked state or custom storage',()=>{
 const trip={countryId:'VN',cityId:'danang',departureDate:'2027-11-10',returnDate:'2027-11-15',travelPurpose:'sightseeing',baggageType:'checked'};
 const custom={id:'custom:existing-adapter',name:'여행용 변환 어댑터(돼지코)',categoryId:'electronics'};
 const defaults=getDefaultBagItems(trip,[custom]);assert.ok(!defaults.some(i=>i.id===vietnamAdapterItem.id));
 const state=restoreBag({version:1,customItems:[custom],checkedIds:[custom.id,'essential:passport']},defaults);
 assert.equal(state.customItems[0].id,custom.id);assert.deepEqual(state.checkedIds,[custom.id,'essential:passport']);
 assert.equal([...defaults,...state.customItems].filter(i=>i.name===custom.name).length,1);
});
