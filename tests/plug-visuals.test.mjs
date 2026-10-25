import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { getElectricitySourceIds, getCountryPlugVisuals } = await loadTs('src/service/data/plugVisuals.ts');
const { getSource } = await loadTs('src/service/data/sources.ts');
test('country electricity citations never inherit Japan and unsupported countries never borrow sources',()=>{
  assert.deepEqual(getElectricitySourceIds('US'),['us-energy']);
  assert.deepEqual(getElectricitySourceIds('AU'),['au-electricity']);
  for(const country of ['US','AU','TW']) for(const id of getElectricitySourceIds(country)) {
    const source=getSource(id);assert.ok(source);assert.ok(!source.url.includes('japan.travel'));assert.ok(!source.organization.includes('JNTO'));
  }
  assert.ok(getElectricitySourceIds('JP').includes('jnto-electricity'));
  for(const country of ['unknown','toString']) {
    assert.deepEqual(getElectricitySourceIds(country),[]);assert.deepEqual(getCountryPlugVisuals(country),[]);
  }
  assert.equal(getSource('us-energy').lastVerified,'2026-10-25');
  assert.equal(getSource('au-electricity').lastVerified,'2026-10-25');
  assert.equal(getSource('jnto-electricity').lastVerified,'2026-10-23');
  assert.equal(getSource('au-facts').lastVerified,'2026-10-23');
});
test('only verified country shapes appear and Australia includes ungrounded and grounded versions',()=>{
  assert.deepEqual(getCountryPlugVisuals('US'),['A','B']);assert.deepEqual(getCountryPlugVisuals('TW'),['A','B']);
  assert.deepEqual(getCountryPlugVisuals('AU'),['I2','I3']);assert.deepEqual(getCountryPlugVisuals('JP'),['A']);
});
