import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { electricity, getCountryElectricity, getElectricityBrief, plugTypes } = await loadTs('src/service/data/electricity.ts');
const { destinations } = await loadTs('src/service/destination/destinations.ts');
const { getSource } = await loadTs('src/service/data/sources.ts');
const { getInternationalProfile } = await loadTs('src/service/data/international.ts');
const { getDefaultBagItems, restoreBag } = await loadTs('src/service/my-bag/bag.ts');

test('all existing Taiwan cities resolve the same verified national electricity data and matching brief', () => {
  const country=destinations.find(c=>c.id==='TW');
  assert.deepEqual(country.cities.map(c=>c.id),['taipei','kaohsiung']);
  for(const city of country.cities) {
    const data=getCountryElectricity(country.id);
    assert.strictEqual(data,electricity.TW,city.id);
    assert.deepEqual(data.voltageV.value,[110]);
    assert.deepEqual(data.frequencyHz.value,[60]);
    assert.deepEqual(data.plugTypeIds.value,['A','B']);
    assert.deepEqual(getElectricityBrief(country.id),{main:'110V · 60Hz',note:'Type A / B · 변환 어댑터 준비'});
    for(const key of ['voltageV','frequencyHz','plugTypeIds','additionalVoltage']) {
      assert.equal(data[key].status,'verified');
      assert.equal(data[key].lastVerified,'2026-10-25');
      for(const id of data[key].sourceIds) assert.equal(getSource(id).lastVerified,'2026-10-25');
    }
    assert.match(data.additionalVoltage.value,/일부 건물.*220V.*실제 콘센트/);
    assert.ok(plugTypes.B.evidence.sourceIds.includes('taoyuan-tourism-electricity'));
  }
  for(const invalid of ['Taiwan','taiwan','taipei','kaohsiung','toString']) assert.equal(getCountryElectricity(invalid),null);
});

test('device guidance distinguishes plug adaptation and voltage conversion without changing existing countries', () => {
  const tw=getCountryElectricity('TW');
  assert.match(tw.deviceCaution.text,/모양만.*전압을 바꾸지/);
  assert.match(tw.deviceCaution.text,/INPUT 전압·주파수/);
  assert.match(tw.travelerAdvice.join(' '),/INPUT 100–240V.*60Hz.*일반적으로/);
  assert.match(tw.travelerAdvice.join(' '),/220V 전용.*어댑터만으로 사용할 수 없.*변압기/);
  assert.deepEqual(electricity.JP.voltageV.value,[100]);
  assert.deepEqual(electricity.JP.frequencyHz.value,[50,60]);
  assert.equal(getElectricityBrief('JP').main,'100V · Type A');
  assert.equal(getInternationalProfile('US').electricity.value,'110–120V · 60Hz · 2핀 또는 3핀');
  assert.equal(getInternationalProfile('AU').electricity.value,'220–240V · 50Hz · 역 V자 평핀 호주형');
  for(const unknown of ['unknown']) assert.equal(getElectricityBrief(unknown),null);
});

test('electricity does not invent new checklist IDs or discard existing user checks', () => {
  for(const cityId of ['taipei','kaohsiung']) {
    const items=getDefaultBagItems({countryId:'TW',cityId,departureDate:'2099-11-10',returnDate:'2099-11-15',travelPurpose:'sightseeing',baggageType:'checked'});
    assert.equal(items.length,new Set(items.map(i=>i.id)).size);
    assert.equal(items.filter(i=>i.id==='electronic:travel-adapter').length,1);
    const restored=restoreBag({version:1,checkedIds:[items[0].id],customItems:[]},items);
    assert.deepEqual(restored.checkedIds,[items[0].id]);
  }
});
