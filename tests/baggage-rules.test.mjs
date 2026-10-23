import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { baggageRules } = await loadTs('src/service/data/baggageRules.ts');
const get = id => baggageRules.find(rule => rule.id === id);

test('2026 power-bank limits retain approval threshold, implementation date and both charging prohibitions', () => {
  const rule = get('power-banks');
  assert.equal(rule.scope.effectiveFrom, '2026-04-20');
  assert.equal(rule.checked.value, 'prohibited');
  assert.equal(rule.cabin.value, 'conditional');
  assert.equal(rule.limits.value.find(limit => limit.unit === 'count').maximum, 2);
  assert.equal(rule.limits.value.find(limit => limit.unit === 'Wh').maximum, 160);
  assert.match(rule.details.value.join(' '), /100Wh 초과~160Wh.*승인/);
  assert.match(rule.details.value.join(' '), /자체의 충전.*다른 기기를 충전/);
  assert.ok(rule.officialSourceIds.includes('molit-power-banks-2026'));
});
test('liquids retain container and sealed bag limits while sprays distinguish three uses', () => {
  assert.deepEqual(get('liquids-gels').limits.value.map(limit => limit.maximum), [100, 1000]);
  const sprays = get('aerosols-dangerous-goods');
  assert.equal(sprays.cabin.value, 'conditional');
  assert.equal(sprays.checked.value, 'conditional');
  const text = sprays.details.value.join(' ');
  for (const pattern of [/종류당.*500mL 이하 1개/, /2kg\(2L\)/, /호신용.*객실 불가/, /인화성 살충제.*객실과 위탁 모두 반입 불가/]) assert.match(text, pattern);
});
test('exceptions and unresolved information are preserved without fabricated airline allowances', () => {
  assert.match(get('sharp-objects').details.value.join(' '), /안전면도기/);
  assert.match(get('electronics').details.value.join(' '), /분리한 여분 리튬배터리.*위탁할 수 없/);
  assert.equal(get('electronics').limits.value.length, 0);
  for (const id of ['cabin-baggage', 'checked-baggage']) {
    assert.equal(get(id).limits.status, 'needs-research');
    assert.equal(get(id).limits.value, null);
    assert.equal(get(id).cabin.value, null);
  }
  for (const rule of baggageRules.filter(rule => rule.summary)) {
    assert.equal(rule.summary.status, 'verified');
    assert.ok(rule.unresolved.length);
    assert.equal(rule.summary.lastVerified, '2026-10-23');
  }
});
