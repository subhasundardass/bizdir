import { getQueryClient } from '@/lib/query-client';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getModel, clean, convert, coordinates, key } from '../record-validation';
const field = (name: string, model: string) => getModel(model).fields.find((f) => f.name === name)!;
test('coordinates distinguish omitted, cleared, and zero coordinates', () => {
  assert.equal(coordinates({}, false), undefined);
  assert.equal(coordinates({ latitude: '', longitude: '' }, false), null);
  assert.deepEqual(coordinates({ latitude: 0, longitude: '0' }, true), {
    latitude: 0,
    longitude: 0
  });
  for (const point of [
    { latitude: null, longitude: null },
    { latitude: '', longitude: 10 },
    { latitude: 91, longitude: 0 },
    { latitude: true, longitude: 0 }
  ])
    assert.throws(() => coordinates(point, true));
});
test('IDs retain bigint precision and enforce PostgreSQL bounds', () => {
  assert.equal(convert(field('business_id', 'review'), '9007199254740993'), 9007199254740993n);
  for (const value of ['9223372036854775808', '-1', '0', '1.5'])
    assert.throws(() => convert(field('business_id', 'review'), value));
  assert.throws(() => convert(field('city_id', 'business'), 2147483648));
  assert.throws(() => convert(field('city_id', 'business'), true));
});
test('dates reject calendar overflow and opening hours preserve compound keys', () => {
  assert.throws(() => convert(field('starts_on', 'business_subscription'), '2026-02-31'));
  const parsed = key(getModel('business_hours'), {
    business_id: '10',
    weekday: 1,
    open_time: '1970-01-01T09:30:00.000Z'
  });
  assert.deepEqual(parsed, {
    business_id_weekday_open_time: {
      business_id: 10n,
      weekday: 1,
      open_time: new Date('1970-01-01T09:30:00Z')
    }
  });
});
test('generated fields and unknown input cannot overwrite database fields', () => {
  const values = clean(
    getModel('business'),
    { id: '1', name: 'New name', rating: 5, review_count: 100, geom: 'unsafe' },
    true
  );
  assert.equal(values.name, 'New name');
  for (const key of ['id', 'rating', 'review_count', 'geom']) assert.equal(values[key], undefined);
});
test('aliases normalize consistently and constraints fail before database writes', () => {
  assert.equal(
    clean(
      getModel('concept_alias'),
      { concept_id: 1, text: '  Fast   FOOD ', kind: 'synonym' },
      false
    ).text,
    'fast food'
  );
  assert.throws(
    () => clean(getModel('review'), { business_id: '1', reviewer_name: 'Test', rating: 6 }, false),
    /between 1 and 5/
  );
  assert.throws(
    () =>
      clean(
        getModel('business_subscription'),
        { business_id: '1', plan: 'premium', starts_on: '2026-10-20', ends_on: '2026-10-19' },
        false
      ),
    /end date/
  );
  assert.throws(
    () =>
      clean(
        getModel('business_hours'),
        { business_id: '1', weekday: 1, open_time: '10:00', close_time: '09:00' },
        false
      ),
    /Closing time/
  );
});

test('lead phones accept international numbers and resource keys match the live schema', () => {
  const lead = clean(getModel('lead'), { business_id: '1', customer_phone: '+14155552671' }, false);
  assert.equal(lead.customer_phone, '+14155552671');
  assert.deepEqual(getModel('business_attribute').keys, ['id']);
  assert.deepEqual(getModel('attribute_alias').keys, ['text']);
  for (const name of [
    'business_claim',
    'business_closure',
    'attribute_option',
    'concept_attribute'
  ])
    assert.ok(getModel(name).fields.length > 0);
  for (const name of ['lead_status_history', 'search_impression'])
    assert.ok(getModel(name).readonly);
});

test('server requests isolate query caches and cached authentication state', () => {
  const first = getQueryClient();
  const second = getQueryClient();
  assert.notEqual(first, second);
  first.setQueryData(['admin-session'], true);
  assert.equal(second.getQueryData(['admin-session']), undefined);
  first.clear();
  second.clear();
});
