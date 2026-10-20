import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { toJSON, fromCrossJSON } from 'seroval';
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
const base = process.env.ADMIN_TEST_URL || 'http://localhost:3000';
let source = '';
for (const file of await readdir('.output/server/_ssr')) {
  if (file.startsWith('api-')) {
    const s = await readFile(`.output/server/_ssr/${file}`, 'utf8');
    if (s.includes('name: "signIn"')) source = s;
  }
}
assert(source, 'Build the application before running this smoke check.');
const ids = Object.fromEntries(
  [...source.matchAll(/id: "([a-f0-9]+)",\s*name: "(\w+)"/g)].map((m) => [m[2], m[1]])
);
let cookie = '';
async function call(name, data, post = false, origin = base) {
  const payload = toJSON({ data, context: {} });
  const url = `${base}/_serverFn/${ids[name]}${post ? '' : '?payload=' + encodeURIComponent(JSON.stringify(payload))}`;
  const res = await fetch(url, {
    method: post ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      'x-tsr-serverfn': 'true',
      origin,
      ...(cookie ? { cookie } : {})
    },
    ...(post ? { body: JSON.stringify(payload) } : {})
  });
  const raw = await res.text();
  let value;
  try {
    value = fromCrossJSON(JSON.parse(raw), { refs: new Map() });
  } catch {
    value = raw;
  }
  return { res, raw, value };
}
const home = await fetch(base + '/');
assert.equal(home.status, 200);
assert((await home.text()).includes('Find the best'), 'The public homepage must render at /.');
const admin = await fetch(base + '/admin', { redirect: 'manual' });
assert.equal(admin.status, 200);
assert(
  (await admin.text()).includes('JustDial Admin'),
  'Admin must render in the same application at /admin.'
);
for (const path of [
  '/admin',
  '/result?query=restaurants',
  '/admin/business',
  '/result?query=plumber',
  '/admin'
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `Route failed: ${path}`);
  assert(
    !(await response.text()).includes('isDehydrated'),
    'A request reused another router cache.'
  );
}
for (const [from, to] of [
  ['/dashboard', '/admin'],
  ['/dashboard/overview', '/admin'],
  ['/dashboard/business', '/admin/business']
]) {
  const response = await fetch(base + from, { redirect: 'manual' });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get('location'), base).pathname, to);
}
const denied = await call('readData', { model: 'business', page: 0, search: '', status: '' });
assert(
  denied.raw.includes('session has expired'),
  'Unauthenticated database access must be rejected.'
);
const wrong = await call('signIn', { password: 'incorrect-test-password' }, true);
assert(wrong.raw.includes('Incorrect admin password'));
const signed = await call('signIn', { password: process.env.ADMIN_PASSWORD }, true);
assert(
  signed.res.headers.get('set-cookie')?.includes('HttpOnly'),
  'Sign-in must set an HTTP-only cookie.'
);
cookie = signed.res.headers.get('set-cookie').split(';')[0];
const dashboard = await call('overview');
assert.equal(typeof dashboard.value.result.places, 'number', 'Authenticated overview failed.');
for (const model of [
  'business',
  'location',
  'concept',
  'attribute',
  'app_user',
  'review',
  'lead',
  'creator',
  'payout',
  'business_subscription',
  'business_media',
  'business_hours',
  'business_concept',
  'business_attribute',
  'concept_alias',
  'location_alias',
  'search_log',
  'click_log',
  'attribute_alias',
  'attribute_option',
  'business_alias',
  'business_claim',
  'business_closure',
  'concept_attribute',
  'lead_status_history',
  'search_impression'
]) {
  const r = await call('readData', { model, page: 0, search: '', status: '' });
  assert.equal(typeof r.value.result?.total, 'number', `${model} list failed`);
}
const cities = await call('lookup', { model: 'location', search: '', field: 'city_id' });
assert(
  Array.isArray(cities.value.result) && cities.value.result.every((r) => r.level === 'city'),
  'City lookup must filter location levels.'
);
if (cities.value.result.length) {
  const current = await call('lookup', {
    model: 'location',
    search: '',
    field: 'city_id',
    id: String(cities.value.result[0].id)
  });
  assert.equal(
    current.value.result.length,
    cities.value.result.length,
    'A selected record must not hide other selector choices.'
  );
  const locality = await call('lookup', {
    model: 'location',
    search: '',
    field: 'locality_id',
    parentId: String(cities.value.result[0].id)
  });
  assert(
    locality.value.result.every((r) => String(r.parent_id) === String(cities.value.result[0].id))
  );
}
const filtered = await call('readData', {
  model: 'business',
  page: 0,
  search: '',
  status: 'active'
});
assert(
  filtered.value.result.rows.every((r) => r.status === 'active'),
  'Status filtering failed.'
);
const invalidSlug = await call(
  'saveRecord',
  {
    model: 'attribute',
    values: { name: 'Validation only', slug: 'Invalid slug', is_active: true }
  },
  true
);
assert(invalidSlug.raw.includes('lowercase slug'), 'Invalid slugs must fail before saving.');
const invalidRating = await call(
  'saveRecord',
  { model: 'review', values: { business_id: '1', reviewer_name: 'Validation only', rating: 6 } },
  true
);
assert(invalidRating.raw.includes('between 1 and 5'), 'Invalid ratings must fail before saving.');
const foreign = await call(
  'saveRecord',
  { model: 'business', values: {} },
  true,
  'https://foreign.example'
);
assert(
  foreign.raw.includes('Cross-origin request rejected'),
  'Cross-origin writes must be rejected.'
);
const readOnly = await call('saveRecord', { model: 'search_log', values: {} }, true);
assert(readOnly.raw.includes('read only'), 'Logs must reject writes.');
const invalid = await call('saveRecord', { model: 'business', values: {} }, true);
assert(invalid.raw.includes('required'), 'Invalid place data must be rejected.');
const signedOut = await call('signOut', undefined, true);
assert(
  signedOut.res.headers.get('set-cookie')?.includes('Max-Age=0'),
  'Logout must clear the session cookie.'
);
// Logout clears the browser cookie; do not reuse the previous cookie.
cookie = '';
const anonymous = await call('session');
assert.equal(anonymous.value.result, false, 'Anonymous session must be false.');
console.log(
  'PASS: public homepage, /admin, legacy redirects, login, 26 authenticated resource lists, overview, anonymous access, origin checks, read-only logs, required fields, and logout. No database writes performed.'
);
