import { database, Prisma } from './db';
import { getModel, clean, key, coordinates, type Row } from './record-validation';
export type RecordInput = { model: string; values: Row; original?: Row };
type Transaction = Prisma.TransactionClient;
export function delegate(name: string, tx: any = database()): any {
  getModel(name);
  return tx[name];
}
async function lockPlaces(tx: Transaction, ids: bigint[]) {
  if (ids.length)
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM business WHERE id IN (${Prisma.join([...new Set(ids)].sort((a, b) => (a < b ? -1 : 1)))}) ORDER BY id FOR UPDATE`
    );
}
async function rating(tx: Transaction, businessId: bigint) {
  const aggregate = await tx.review.aggregate({
    where: { business_id: businessId, status: 'approved' },
    _avg: { rating: true },
    _count: { id: true }
  });
  await tx.business.update({
    where: { id: businessId },
    data: {
      rating: aggregate._avg.rating || 0,
      review_count: aggregate._count.id,
      updated_at: new Date()
    }
  });
}
// Internal transaction service; public server functions enforce authentication and origin checks.
export async function saveWithinTransaction(tx: Transaction, input: RecordInput): Promise<Row> {
  const m = getModel(input.model);
  if (m.readonly) throw new Error('Activity logs are read only.');
  const existing = input.original
    ? await delegate(m.name, tx).findUniqueOrThrow({ where: key(m, input.original) })
    : undefined;
  const values = clean(m, input.values, !!existing);
  const effective = { ...existing, ...values };
  if (m.name === 'business_attribute') {
    const attribute = await tx.attribute.findUniqueOrThrow({
      where: { id: effective.attribute_id }
    });
    if (
      attribute.value_type === 'bool' &&
      (effective.value_number != null || effective.option_id != null)
    )
      throw new Error('Yes/no attributes do not accept a number or option.');
    if (
      attribute.value_type === 'number' &&
      (effective.value_number == null || effective.option_id != null)
    )
      throw new Error('Number attributes require a numeric value and no option.');
    if (attribute.value_type === 'choice') {
      if (!effective.option_id || effective.value_number != null)
        throw new Error('Choice attributes require an option and no numeric value.');
      const option = await tx.attribute_option.findUniqueOrThrow({
        where: { id: effective.option_id }
      });
      if (option.attribute_id !== attribute.id)
        throw new Error('Choose an option belonging to the selected attribute.');
    }
  }
  if (m.name === 'lead') {
    const status = effective.status ?? 'new';
    if (status === 'booked' && effective.booking_value == null)
      throw new Error('Booked leads require a booking value.');
    if (effective.commission_amount != null && status !== 'booked')
      throw new Error('Only booked leads can have a commission.');
    if (effective.payout_id) {
      if (
        status !== 'booked' ||
        effective.commission_amount == null ||
        !effective.guest_confirmed_at
      )
        throw new Error('Payouts require a booked lead, commission, and guest confirmation.');
      const payout = await tx.payout.findUniqueOrThrow({ where: { id: effective.payout_id } });
      if (payout.creator_id !== effective.creator_id)
        throw new Error('Choose a payout belonging to the lead creator.');
    }
  }
  if (effective.open_time && effective.close_time && effective.close_time <= effective.open_time)
    throw new Error('Closing time must be after opening time.');
  if (effective.starts_on && effective.ends_on && effective.ends_on < effective.starts_on)
    throw new Error('The subscription end date must be on or after the start date.');
  if (m.name === 'review')
    await lockPlaces(tx, [effective.business_id, ...(existing ? [existing.business_id] : [])]);
  if ((m.name === 'location' || m.name === 'concept') && effective.parent_id) {
    let id: number | null = effective.parent_id;
    const seen = new Set<number>(existing ? [existing.id] : []);
    while (id) {
      if (seen.has(id))
        throw new Error('A parent cannot be this record or one of its descendants.');
      seen.add(id);
      const ancestor = await delegate(m.name, tx).findUniqueOrThrow({
        where: { id },
        select: { parent_id: true }
      });
      id = ancestor.parent_id;
    }
  }
  if (m.name === 'location') {
    const levels: Record<string, string[]> = {
      state: [],
      district: ['state'],
      city: ['district'],
      locality: ['city'],
      landmark: ['city', 'locality']
    };
    if (effective.parent_id) {
      const parent = await tx.location.findUniqueOrThrow({ where: { id: effective.parent_id } });
      if (!levels[effective.level]?.includes(parent.level))
        throw new Error('Choose a parent with the correct geographic level.');
    } else if (effective.level !== 'state')
      throw new Error('Districts, cities, localities, and landmarks require a parent location.');
    if (existing) {
      const children = await tx.location.findMany({
        where: { parent_id: existing.id },
        select: { level: true }
      });
      if (children.some((c) => !levels[c.level]?.includes(effective.level)))
        throw new Error('This level would invalidate child locations.');
      if (
        effective.level !== existing.level &&
        (await tx.business.count({
          where: { OR: [{ city_id: existing.id }, { locality_id: existing.id }] }
        }))
      )
        throw new Error('This location is used by places. Keep its geographic level.');
      if (
        effective.parent_id !== existing.parent_id &&
        (await tx.business.count({
          where: { locality_id: existing.id, city_id: { not: effective.parent_id ?? -1 } }
        }))
      )
        throw new Error('Move places to the new city before moving this locality.');
    }
  }
  let row: Row;
  if (m.name === 'business') {
    const point = coordinates(input.values, !existing);
    if (point === null) throw new Error('Place coordinates are required.');
    const city = await tx.location.findUnique({ where: { id: effective.city_id } });
    if (city?.level !== 'city') throw new Error('Choose a city location.');
    if (effective.locality_id) {
      const locality = await tx.location.findUnique({ where: { id: effective.locality_id } });
      if (locality?.level !== 'locality' || locality.parent_id !== city.id)
        throw new Error('Choose a locality belonging to the selected city.');
    }
    if (existing) row = await tx.business.update({ where: { id: existing.id }, data: values });
    else {
      const columns = Object.keys(values);
      const inserted: Row[] = await tx.$queryRaw(
        Prisma.sql`INSERT INTO business (${Prisma.join(columns.map((c) => Prisma.raw('"' + c + '"')))},geom) VALUES (${Prisma.join(Object.values(values))},ST_SetSRID(ST_MakePoint(${point!.longitude},${point!.latitude}),4326)::geography) RETURNING id`
      );
      row = inserted[0];
    }
    if (point)
      await tx.$executeRaw(
        Prisma.sql`UPDATE business SET geom=ST_SetSRID(ST_MakePoint(${point.longitude},${point.latitude}),4326)::geography WHERE id=${row.id}`
      );
    if (input.values.primary_concept_id !== undefined) {
      if (!input.values.primary_concept_id)
        throw new Error('Choose a primary category for this place.');
      const categoryId = Number(input.values.primary_concept_id);
      if (!Number.isInteger(categoryId)) throw new Error('Choose a valid primary category.');
      const category = await tx.concept.findUnique({ where: { id: categoryId } });
      if (category?.type !== 'category')
        throw new Error('Choose a category as the primary category.');
      await tx.business_concept.updateMany({
        where: { business_id: row.id, is_primary: true },
        data: { is_primary: false }
      });
      // Prisma's native upsert cannot target this schema's partial primary-category index.
      const updated = await tx.business_concept.updateMany({
        where: { business_id: row.id, concept_id: categoryId },
        data: { is_primary: true }
      });
      if (!updated.count)
        await tx.business_concept.create({
          data: { business_id: row.id, concept_id: categoryId, is_primary: true }
        });
    } else if (!existing) throw new Error('Choose a primary category for this place.');
  } else {
    row = existing
      ? await delegate(m.name, tx).update({ where: key(m, existing), data: values })
      : await delegate(m.name, tx).create({ data: values });
  }
  if (m.name === 'business_claim' && row.status === 'approved') {
    await tx.business.update({
      where: { id: row.business_id },
      data: { owner_user_id: row.user_id, updated_at: new Date() }
    });
    if (!row.reviewed_at)
      row = await tx.business_claim.update({
        where: { id: row.id },
        data: { reviewed_at: new Date() }
      });
  }
  if (m.name === 'location') {
    const point = coordinates(input.values, false);
    if (point)
      await tx.$executeRaw(
        Prisma.sql`UPDATE location SET geom=ST_SetSRID(ST_MakePoint(${point.longitude},${point.latitude}),4326)::geography WHERE id=${row.id}`
      );
    else if (point === null)
      await tx.$executeRaw(Prisma.sql`UPDATE location SET geom=NULL WHERE id=${row.id}`);
    if (effective.geom_verified) {
      const check: { present: boolean }[] = await tx.$queryRaw(
        Prisma.sql`SELECT geom IS NOT NULL AS present FROM location WHERE id=${row.id}`
      );
      if (!check[0]?.present) throw new Error('Add coordinates before marking geometry verified.');
    }
  }
  if (m.name === 'review') {
    await rating(tx, row.business_id);
    if (existing && existing.business_id !== row.business_id)
      await rating(tx, existing.business_id);
  }
  return row;
}
export async function removeWithinTransaction(
  tx: Transaction,
  input: { model: string; original: Row }
) {
  const m = getModel(input.model);
  if (m.readonly) throw new Error('Activity logs are read only.');
  const existing = await delegate(m.name, tx).findUniqueOrThrow({ where: key(m, input.original) });
  if (m.name === 'review') await lockPlaces(tx, [existing.business_id]);
  await delegate(m.name, tx).delete({ where: key(m, existing) });
  if (m.name === 'review') await rating(tx, existing.business_id);
}
export function friendly(error: any): never {
  if (error.code === 'P2002') throw new Error('A record with these unique values already exists.');
  if (error.code === 'P2003')
    throw new Error(
      'This record references another record, or is still in use. Check linked records first.'
    );
  if (error.code === 'P2025')
    throw new Error('This record no longer exists. Refresh and try again.');
  if (error.code)
    throw new Error('The database rejected this change. Check the values and related records.');
  throw error;
}
