import assert from 'node:assert/strict';
import { models } from '../src/features/admin/models';
import { randomBytes } from 'node:crypto';
import { database } from '../src/server/db';
import { saveWithinTransaction, removeWithinTransaction, delegate } from '../src/server/records';
import { getModel, key, type Row } from '../src/server/record-validation';
const db = database();
const tag = 'admin_check_' + randomBytes(5).toString('hex');
const rollback = new Error('ROLLBACK_ADMIN_CHECK');
const records: { model: string; row: Row }[] = [];
let checks = 0;
try {
  await db.$transaction(
    async (tx) => {
      async function add(model: string, values: Row) {
        const row = await saveWithinTransaction(tx, { model, values });
        records.push({ model, row });
        return row;
      }
      async function edit(model: string, row: Row, values: Row) {
        return saveWithinTransaction(tx, { model, values, original: row });
      }
      let savepoint = 0;
      async function rejected(action: () => Promise<unknown>, pattern: RegExp) {
        const point = 'admin_check_' + ++savepoint;
        await tx.$executeRawUnsafe('SAVEPOINT ' + point);
        try {
          await assert.rejects(action, pattern);
          checks++;
        } finally {
          await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT ' + point);
          await tx.$executeRawUnsafe('RELEASE SAVEPOINT ' + point);
        }
      }
      const state = await add('location', {
        name: tag + ' State',
        slug: tag.replaceAll('_', '-') + '-state',
        level: 'state'
      });
      const district = await add('location', {
        name: tag + ' District',
        slug: tag.replaceAll('_', '-') + '-district',
        level: 'district',
        parent_id: state.id
      });
      const city = await add('location', {
        name: tag + ' City',
        slug: tag.replaceAll('_', '-') + '-city',
        level: 'city',
        parent_id: district.id
      });
      const locality = await add('location', {
        name: tag + ' Locality',
        slug: tag.replaceAll('_', '-') + '-locality',
        level: 'locality',
        parent_id: city.id,
        latitude: '28.61',
        longitude: '77.20',
        geom_verified: true
      });
      const category = await add('concept', { name: tag, slug: tag, type: 'category' });
      const service = await add('concept', {
        name: tag + ' Service',
        slug: tag + '_service',
        type: 'service',
        parent_id: category.id
      });
      const attribute = await add('attribute', { name: tag, slug: tag });
      const phone = '+919' + String(Date.now() % 1000000000).padStart(9, '0');
      const user = await add('app_user', { name: tag, phone, role: 'creator' });
      const creator = await add('creator', {
        user_id: String(user.id),
        code: tag,
        display_name: tag,
        commission_pct: '5.5'
      });
      const values = {
        name: tag,
        slug: tag.replaceAll('_', '-'),
        city_id: city.id,
        locality_id: locality.id,
        phone,
        latitude: '28.61',
        longitude: '77.20',
        primary_concept_id: category.id,
        status: 'active',
        source: 'team'
      };
      const place = await add('business', values);
      const second = await add('business', {
        ...values,
        name: tag + ' Second',
        slug: values.slug + '-second'
      });
      await edit(
        'business',
        { ...place, city_id: 999999 },
        { description: 'Updated through the admin service' }
      );
      const point: Row[] = await tx.$queryRawUnsafe(
        'SELECT ST_Y(geom::geometry) AS latitude, ST_X(geom::geometry) AS longitude FROM business WHERE id=$1',
        place.id
      );
      assert.equal(point[0].latitude, 28.61);
      assert.equal(point[0].longitude, 77.2);
      checks++;
      await add('business_attribute', {
        business_id: String(place.id),
        attribute_id: attribute.id
      });
      await add('business_concept', {
        business_id: String(place.id),
        concept_id: service.id,
        is_primary: false
      });
      const hours = await add('business_hours', {
        business_id: String(place.id),
        weekday: 1,
        open_time: '09:30',
        close_time: '17:00'
      });
      await edit('business_hours', hours, { close_time: '18:00' });
      const media = await add('business_media', {
        business_id: String(place.id),
        kind: 'photo',
        url: 'https://example.com/admin-check.jpg'
      });
      await edit('business_media', media, { sort_order: 2 });
      const subscription = await add('business_subscription', {
        business_id: String(place.id),
        plan: 'premium',
        starts_on: '2026-10-01',
        ends_on: '2026-10-31',
        amount_paid: '100.50'
      });
      const payout = await add('payout', {
        creator_id: String(creator.id),
        period_month: '2026-10-01',
        amount: '5.50'
      });
      const lead = await add('lead', {
        business_id: String(place.id),
        creator_id: String(creator.id),
        customer_phone: phone,
        customer_name: tag,
        consent_to_share: true
      });
      await edit('lead', lead, { status: 'contacted' });
      await edit('lead', lead, {
        status: 'booked',
        booking_value: '100',
        commission_amount: '5.50',
        guest_confirmed_at: '2026-10-20T12:00:00Z',
        payout_id: String(payout.id)
      });
      assert.equal(await tx.lead_status_history.count({ where: { lead_id: lead.id } }), 3);
      checks++;
      const claim = await add('business_claim', {
        business_id: String(place.id),
        user_id: String(user.id)
      });
      await edit('business_claim', claim, { status: 'approved' });
      assert.equal(
        (await tx.business.findUniqueOrThrow({ where: { id: place.id } })).owner_user_id,
        user.id
      );
      checks++;
      const review = await add('review', {
        business_id: String(place.id),
        reviewer_name: tag,
        rating: 5,
        status: 'approved'
      });
      await edit('review', { ...review, business_id: second.id }, { rating: 4 });
      assert.equal(
        Number((await tx.business.findUniqueOrThrow({ where: { id: place.id } })).rating),
        4
      );
      checks++;
      await edit('review', review, { business_id: String(second.id) });
      assert.equal(
        (await tx.business.findUniqueOrThrow({ where: { id: place.id } })).review_count,
        0
      );
      assert.equal(
        (await tx.business.findUniqueOrThrow({ where: { id: second.id } })).review_count,
        1
      );
      checks++;
      await add('business_alias', {
        business_id: String(place.id),
        text: tag + ' Place alias',
        kind: 'other'
      });
      await add('business_closure', {
        business_id: String(place.id),
        closed_on: '2026-10-20',
        reason: 'Verification only'
      });
      await add('attribute_alias', { attribute_id: attribute.id, text: tag + ' Attribute alias' });
      await add('concept_attribute', {
        concept_id: category.id,
        attribute_id: attribute.id,
        is_required: false
      });
      const choice = await add('attribute', {
        name: tag + ' Choice',
        slug: tag + '_choice',
        value_type: 'choice'
      });
      const option = await add('attribute_option', {
        attribute_id: choice.id,
        name: 'Option',
        slug: 'option'
      });
      await add('business_attribute', {
        business_id: String(place.id),
        attribute_id: choice.id,
        option_id: option.id
      });
      await add('concept_alias', {
        concept_id: category.id,
        text: '  ' + tag.toUpperCase() + '   ALIAS ',
        kind: 'synonym'
      });
      await add('location_alias', { location_id: city.id, text: tag + ' City alias' });
      await rejected(() => edit('location', state, { parent_id: locality.id }), /descendants/);
      await rejected(() => edit('business_hours', hours, { close_time: '08:00' }), /Closing time/);
      await rejected(
        () => edit('business_subscription', subscription, { ends_on: '2026-09-30' }),
        /end date/
      );
      await rejected(
        () => edit('business', place, { latitude: null, longitude: null }),
        /coordinates/
      );
      await rejected(() => edit('business', place, { primary_concept_id: '' }), /primary category/);
      await rejected(
        () =>
          add('location', {
            name: tag + ' Invalid',
            slug: values.slug + '-invalid',
            level: 'city',
            parent_id: district.id,
            geom_verified: true
          }),
        /coordinates/
      );
      await rejected(
        () => removeWithinTransaction(tx, { model: 'location', original: state }),
        /Foreign key constraint/
      );
      const editable = models
        .filter((m) => !m.readonly)
        .map((m) => m.name)
        .sort();
      assert.deepEqual(
        [...new Set(records.map((r) => r.model))].sort(),
        editable,
        'All editable models must be covered.'
      );
      for (const item of records) {
        const current = await delegate(item.model, tx).findUniqueOrThrow({
          where: key(getModel(item.model), item.row)
        });
        const wire = JSON.parse(
          JSON.stringify(current, (_, value) => (typeof value === 'bigint' ? String(value) : value))
        );
        await edit(item.model, wire, wire);
        checks++;
      }
      for (const m of models.filter((m) => m.readonly))
        await rejected(() => saveWithinTransaction(tx, { model: m.name, values: {} }), /read only/);
      // Remove in dependency order, including a review with forged stale relation data.
      for (const item of [...records].reverse()) {
        const exists = await delegate(item.model, tx).findUnique({
          where: key(getModel(item.model), item.row)
        });
        if (exists)
          await removeWithinTransaction(tx, {
            model: item.model,
            original: item.model === 'review' ? { ...item.row, business_id: place.id } : item.row
          });
      }

      throw rollback;
    },
    { timeout: 60000, maxWait: 10000 }
  );
  throw new Error('The verification transaction unexpectedly committed.');
} catch (error) {
  if (error !== rollback) {
    console.error(
      'Admin CRUD verification failed:',
      error instanceof Error ? error.message : 'unknown error'
    );
    process.exitCode = 1;
  }
} finally {
  await db.$disconnect();
}
if (!process.exitCode)
  console.log(`PASS: ${checks} admin CRUD and integrity checks; test transaction rolled back.`);
