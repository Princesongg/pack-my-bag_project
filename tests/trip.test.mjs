import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const destinationUrl = url(compile('../src/service/destination/destinations.ts'));
const source = compile('../src/service/trip/trip.ts').replace(/(['"])\.\.\/destination\/destinations\1/, JSON.stringify(destinationUrl));
const { emptyTrip, dayNumber, localToday, dateErrors, recalculateTrip, restoreTrip, loadTrip, tripComplete, tripKey } = await import(url(source));
const today = '2026-10-23';
const valid = { ...emptyTrip, countryId: 'JP', cityId: 'osaka', departureDate: '2026-12-10', returnDate: '2026-12-14', travelPurpose: 'sightseeing', baggageType: 'checked' };

test('computes nights and inclusive days, including a same-day trip', () => {
  const trip = recalculateTrip(valid, today);
  assert.equal(trip.tripNights, 4); assert.equal(trip.tripDays, 5);
  assert.equal(recalculateTrip({ ...valid, returnDate: valid.departureDate }, today).tripDays, 1);
  assert.equal(recalculateTrip({ ...valid, returnDate: valid.departureDate }, today).tripNights, 0);
});

test('date-only arithmetic crosses DST and leap days without losing days', () => {
  for (const [start, end, days] of [['2027-03-13', '2027-03-15', 2], ['2027-11-06', '2027-11-08', 2], ['2028-02-28', '2028-03-01', 2], ['2026-12-31', '2027-01-01', 1]]) {
    assert.equal(dayNumber(end) - dayNumber(start), days);
  }
  for (const value of ['2027-02-29', '2026-04-31', '2026-13-01', 'not-a-date', '2026-1-01']) assert.equal(dayNumber(value), null);
  assert.equal(localToday(new Date(2026, 9, 23, 23, 59)), today);
});

test('rejects past and reversed dates, allows today', () => {
  assert.ok(dateErrors({ ...valid, departureDate: '2026-10-22' }, today).departure);
  assert.ok(dateErrors({ ...valid, returnDate: '2026-12-09' }, today).returning);
  assert.equal(recalculateTrip({ ...valid, returnDate: '2026-12-09' }, today).tripDays, null);
  assert.equal(dateErrors({ departureDate: today, returnDate: today }, today).departure, '');
});

test('completion requires destination, both dates, purpose and baggage', () => {
  assert.equal(tripComplete(valid, today), true);
  for (const key of ['countryId', 'cityId', 'departureDate', 'returnDate', 'travelPurpose', 'baggageType']) assert.equal(tripComplete({ ...valid, [key]: '' }, today), false);
  assert.equal(tripComplete({ ...valid, returnDate: '2026-12-01' }, today), false);
});

test('restore validates IDs, enums and dates and recalculates untrusted counts', () => {
  assert.equal(restoreTrip({ ...valid, tripDays: 999, tripNights: 999 }, today).tripDays, 5);
  assert.deepEqual(restoreTrip({ ...valid, countryId: 'unknown' }, today), emptyTrip);
  const wrongCity = restoreTrip({ ...valid, cityId: 'hanoi' }, today);
  assert.equal(wrongCity.cityId, ''); assert.equal(wrongCity.departureDate, '');
  assert.equal(restoreTrip({ ...valid, travelPurpose: 'unknown' }, today).travelPurpose, '');
  assert.equal(restoreTrip({ ...valid, baggageType: 'unknown' }, today).baggageType, '');
  assert.equal(restoreTrip({ ...valid, returnDate: '2026-12-01' }, today).returnDate, '');
  assert.equal(restoreTrip(valid, '2027-01-01').departureDate, '');
});

test('migrates legacy selection, restores unified state and handles corrupt or blocked storage', () => {
  const values = new Map([['pack-my-bag.destination.v1', JSON.stringify({ countryId: 'JP', cityId: 'osaka' })]]);
  const storage = { getItem: key => values.get(key) ?? null };
  assert.equal(loadTrip(storage, today).cityId, 'osaka');
  values.set(tripKey, JSON.stringify(valid));
  assert.equal(loadTrip(storage, today).tripDays, 5);
  values.set(tripKey, '{broken');
  assert.deepEqual(loadTrip(storage, today), emptyTrip);
  assert.deepEqual(loadTrip({ getItem: () => { throw Error('blocked'); } }, today), emptyTrip);
});
