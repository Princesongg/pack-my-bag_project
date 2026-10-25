import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { baggageRules } = await loadTs('src/service/data/baggageRules.ts');
const get = id => baggageRules.find(rule => rule.id === id);

test('2026 power banks retain count and charging bans while conflicting capacity guidance stays conditional', () => {
  const rule = get('power-banks');
  assert.equal(rule.scope.effectiveFrom, '2026-04-20');
  assert.equal(rule.checked.value, 'prohibited');
  assert.equal(rule.cabin.value, 'conditional');
  assert.equal(rule.limits.value.find(limit => limit.unit === 'count').maximum, 2);
  assert.equal(rule.limits.value.find(limit => limit.unit === 'Wh'), undefined);
  const text = rule.details.value.join(' ');
  assert.match(text, /IATA 2026.*100Wh 이하.*100Wh 초과~160Wh 이하.*금지/);
  assert.match(text, /국토교통부 2026-04-08.*160Wh 이하.*2026-04-20/);
  assert.match(text, /승인만 받으면 항상 허용된다는 뜻은 아닙니다/);
  assert.match(text, /다른 기기를 충전하거나 보조배터리 자체를 충전하지/);
  assert.match(text, /단락.*방지/);
  assert.match(text, /최대 2개 제한을 모든 여분 배터리에 일괄 적용하지/);
  assert.ok(rule.officialSourceIds.includes('molit-power-banks-2026-policy'));
  assert.ok(rule.officialSourceIds.includes('iata-passenger-batteries-2026'));
  assert.doesNotMatch(rule.summary.value, /각 160Wh 이하/);
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
    assert.equal(rule.summary.lastVerified, ['electronics','power-banks'].includes(rule.id) ? '2026-10-25' : '2026-10-23');
  }
});

test('electronics separate installed devices, power banks/spares and special equipment without blanket permission', async () => {
  const { electronicsGuidance: guide } = await loadTs('src/service/data/electronicsGuidance.ts');
  const { getSource } = await loadTs('src/service/data/sources.ts');
  assert.deepEqual(guide.cards.map(c=>c.id),['installed-devices','power-banks-spares','special-devices']);
  assert.deepEqual(guide.cards[0].badges,['기내 휴대 권장']);
  assert.deepEqual(guide.cards[1].badges,['기내만 가능','위탁 금지']);
  const installed=[...guide.cards[0].description,...guide.cards[0].additional].join(' ');
  for(const term of ['아이패드','닌텐도 스위치','카메라','스마트폰','100Wh 이하','항공사 승인','최대절전','완전한 전원 종료']) assert.ok(installed.includes(term),term);
  assert.match(installed,/100Wh 초과~160Wh 이하.*내장.*항공사 승인/);
  const special=guide.cards[2].description.join(' ');
  assert.match(special,/허용되는 경우.*기내 휴대만.*위탁·기내 사용·충전.*금지/);
  assert.match(special,/목적지·항공사/);
  const rule=get('electronics');
  assert.equal(rule.checked.value,'conditional');
  assert.equal(rule.cabin.value,'conditional');
  assert.equal(rule.scope.departureCountryId,null);
  assert.equal(rule.scope.airlineId,null);
  assert.doesNotMatch(rule.details.value.join(' '),/160Wh 이하인 경우만 운반|위의 별도 2026년 규정/);
  for(const id of guide.sourceIds) {
    assert.equal(getSource(id).status,'verified');
    assert.equal(getSource(id).lastVerified,guide.checkedOn);
    assert.match(getSource(id).url,/^https:\/\/(www\.iata\.org|www\.korea\.kr)\//);
  }
});
