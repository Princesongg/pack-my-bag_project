import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run the actual TypeScript selection logic without adding a test dependency.
const source = readFileSync(new URL('../src/service/destination/destinations.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { destinations, popularCountryIds, filterDestinations, emptySelection, selectionKey, validateSelection, selectCountry, loadSelection, saveSelection } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('all four countries expose exactly the supported city lists', () => {
  assert.deepEqual(destinations.map(country => [country.name, country.cities.map(city => city.name)]), [
    ['일본', ['도쿄', '오사카', '후쿠오카', '삿포로']],
    ['베트남', ['다낭', '하노이', '나트랑', '푸꾸옥']],
    ['태국', ['방콕', '푸껫', '치앙마이']], ['대만', ['타이베이', '가오슝']],
  ]);
});

test('changing country clears city, selecting the same country retains it', () => {
  const selected = { countryId: 'JP', cityId: 'tokyo' };
  assert.deepEqual(selectCountry(selected, 'VN'), { countryId: 'VN', cityId: '' });
  assert.deepEqual(selectCountry(selected, 'JP'), selected);
  assert.deepEqual(selectCountry(selected, 'unknown'), emptySelection);
});

test('rejects invalid saved data and cities belonging to another country', () => {
  for (const value of [null, 42, 'JP', {}, { countryId: 'XX', cityId: 'tokyo' }]) {
    assert.deepEqual(validateSelection(value), emptySelection);
  }
  assert.deepEqual(validateSelection({ countryId: 'JP', cityId: 'hanoi' }), { countryId: 'JP', cityId: '' });
  assert.deepEqual(validateSelection({ countryId: 'JP', cityId: {} }), { countryId: 'JP', cityId: '' });
});

test('persists and restores complete and partial selections for every country', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.deepEqual(loadSelection(storage), emptySelection);
  for (const country of destinations) {
    for (const cityId of ['', ...country.cities.map(city => city.id)]) {
      const selected = { countryId: country.id, cityId };
      assert.equal(saveSelection(storage, selected), true);
      assert.deepEqual(loadSelection(storage), selected);
      assert.deepEqual(JSON.parse(data.get(selectionKey)), selected);
    }
  }
});

test('corrupt JSON and blocked storage do not crash the flow', () => {
  assert.deepEqual(loadSelection({ getItem: () => '{broken' }), emptySelection);
  assert.deepEqual(loadSelection({ getItem: () => { throw new Error('blocked'); } }), emptySelection);
  assert.equal(saveSelection({ setItem: () => { throw new Error('quota exceeded'); } }, { countryId: 'TW', cityId: 'taipei' }), false);
});

test('country search supports Korean, English, partial names, case and whitespace', () => {
  for (const query of ['일본', 'japan', 'JAP', '  Ja PaN  ']) {
    assert.deepEqual(filterDestinations(destinations, query).map(item => item.id), ['JP']);
  }
  assert.deepEqual(filterDestinations(destinations, '베트').map(item => item.id), ['VN']);
  assert.deepEqual(filterDestinations(destinations, 'Canada'), []);
  assert.equal(filterDestinations(destinations, '  ').length, 4);
  assert.equal(popularCountryIds.length, 4);
  assert.ok(popularCountryIds.every(id => destinations.some(country => country.id === id)));
});

test('city search only returns matches in the selected country without changing saved selection', () => {
  const japan = destinations.find(country => country.id === 'JP');
  assert.deepEqual(filterDestinations(japan.cities, '도쿄').map(city => city.id), ['tokyo']);
  assert.deepEqual(filterDestinations(japan.cities, 'TOK').map(city => city.id), ['tokyo']);
  assert.deepEqual(filterDestinations(japan.cities, 'Hanoi'), []);
  const citiesBefore = JSON.stringify(japan.cities);
  filterDestinations(japan.cities, 'does not exist');
  assert.equal(JSON.stringify(japan.cities), citiesBefore);
});
