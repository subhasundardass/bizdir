import { database, Prisma } from './db';
import { requireAdmin, checkOrigin } from './auth';
import { reference } from '@/features/admin/options';
import { type Model } from '@/features/admin/models';
import { getModel as model, convert, type Row } from './record-validation';
import {
  delegate,
  friendly,
  saveWithinTransaction,
  removeWithinTransaction,
  type RecordInput
} from './records';
const json = <T>(value: T): any =>
  JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
function filter(m: Model, search: string, status: string) {
  const terms = m.fields
    .filter((f) => f.type === 'String' && !f.name.endsWith('_id'))
    .map((f) => ({ [f.name]: { contains: search, mode: 'insensitive' } }));
  if (/^\d+$/.test(search)) {
    for (const f of m.fields.filter((f) => f.type === 'Int' || f.type === 'BigInt')) {
      if (f.type === 'BigInt') terms.push({ [f.name]: BigInt(search) } as any);
      else if (Number(search) <= 2147483647) terms.push({ [f.name]: Number(search) } as any);
    }
  }
  return {
    ...(search && terms.length ? { OR: terms } : {}),
    ...(status && m.fields.some((f) => f.name === 'status') ? { status } : {})
  };
}
function order(m: Model) {
  return [
    ...(m.fields.some((f) => f.name === 'created_at') ? [{ created_at: 'desc' }] : []),
    ...m.keys.map((k) => ({ [k]: 'desc' }))
  ];
}
export async function read(input: { model: string; page: number; search: string; status: string }) {
  requireAdmin();
  const m = model(input.model);
  const where = filter(m, input.search, input.status);
  const [rows, total] = await Promise.all([
    delegate(m.name).findMany({ where, orderBy: order(m), skip: input.page * 20, take: 20 }),
    delegate(m.name).count({ where })
  ]);
  if ((m.name === 'business' || m.name === 'location') && rows.length) {
    const coords: any[] = await database().$queryRaw(
      Prisma.sql`SELECT id, ST_Y(geom::geometry) AS latitude, ST_X(geom::geometry) AS longitude FROM ${Prisma.raw(m.name)} WHERE id IN (${Prisma.join(rows.map((r: Row) => r.id))})`
    );
    const primary =
      m.name === 'business'
        ? await database().business_concept.findMany({
            where: { business_id: { in: rows.map((r: Row) => r.id) }, is_primary: true }
          })
        : [];
    for (const row of rows)
      row.primary_concept_id = primary.find((c) => c.business_id === row.id)?.concept_id ?? '';
    for (const row of rows)
      Object.assign(
        row,
        coords.find((c) => c.id === row.id)
      );
  }
  const targets = new Map<string, Set<any>>();
  for (const f of m.fields) {
    const target = reference(m.name, f.name);
    if (!target) continue;
    for (const row of rows)
      if (row[f.name] != null) {
        if (!targets.has(target)) targets.set(target, new Set());
        targets.get(target)!.add(row[f.name]);
      }
  }
  const labels = new Map<string, Map<string, string>>();
  await Promise.all(
    [...targets].map(async ([target, ids]) => {
      const records: Row[] = await delegate(target).findMany({ where: { id: { in: [...ids] } } });
      labels.set(
        target,
        new Map(
          records.map((r) => [
            String(r.id),
            `${r.name ?? r.display_name ?? r.customer_name ?? r.reference ?? 'Record'} · #${r.id}`
          ])
        )
      );
    })
  );
  for (const row of rows) {
    row._labels = {};
    for (const f of m.fields) {
      const target = reference(m.name, f.name);
      if (target) row._labels[f.name] = labels.get(target)?.get(String(row[f.name]));
    }
  }
  return json({ rows, total });
}
export async function getLookup(input: {
  model: string;
  search: string;
  id?: string;
  field?: string;
  parentId?: string;
  levels?: string[];
}) {
  requireAdmin();
  const m = model(input.model);
  if (!m.fields.some((f) => f.name === 'id')) return [];
  const label = [
    'name',
    'display_name',
    'customer_name',
    'reviewer_name',
    'raw_query',
    'code'
  ].find((k) => m.fields.some((f) => f.name === k));
  const scope: Row = {};
  if (m.name === 'location') {
    if (input.field === 'city_id') scope.level = 'city';
    if (input.field === 'locality_id') scope.level = 'locality';
    if (input.levels) scope.level = { in: input.levels };
    if (input.parentId)
      scope.parent_id = convert(m.fields.find((f) => f.name === 'parent_id')!, input.parentId);
  }
  if (m.name === 'concept' && input.field === 'primary_concept_id') scope.type = 'category';
  if (m.name === 'attribute_option' && input.parentId) scope.attribute_id = Number(input.parentId);
  const rows: Row[] = await delegate(m.name).findMany({
    where: { ...filter(m, input.search, ''), ...scope },
    take: 50,
    orderBy: label ? { [label]: 'asc' } : { id: 'desc' }
  });
  if (input.id && !rows.some((r) => String(r.id) === input.id)) {
    const current = await delegate(m.name).findFirst({
      where: { ...scope, id: convert(m.fields.find((f) => f.name === 'id')!, input.id) }
    });
    if (current) rows.unshift(current);
  }
  return json(
    rows.map((r) => ({
      id: r.id,
      label: label ? `${r[label]} · #${r.id}` : `#${r.id}`,
      parent_id: r.parent_id,
      level: r.level
    }))
  );
}
export async function save(input: RecordInput) {
  requireAdmin();
  checkOrigin();
  try {
    await database().$transaction((tx) => saveWithinTransaction(tx, input));
    return { ok: true };
  } catch (error) {
    friendly(error);
  }
}
export async function remove(input: { model: string; original: Row }) {
  requireAdmin();
  checkOrigin();
  try {
    await database().$transaction((tx) => removeWithinTransaction(tx, input));
    return { ok: true };
  } catch (error) {
    friendly(error);
  }
}
export async function dashboard() {
  requireAdmin();
  const db = database();
  const [
    places,
    locations,
    categories,
    leads,
    pendingPlaces,
    pendingReviews,
    active,
    recent,
    searches,
    clicks,
    statuses,
    topCities
  ] = await Promise.all([
    db.business.count(),
    db.location.count(),
    db.concept.count(),
    db.lead.count(),
    db.business.count({ where: { status: 'pending' } }),
    db.review.count({ where: { status: 'pending' } }),
    db.business.count({ where: { status: 'active' } }),
    db.business.findMany({ orderBy: { created_at: 'desc' }, take: 6 }),
    db.search_log.count(),
    db.click_log.count(),
    db.business.groupBy({ by: ['status'], _count: { id: true } }),
    db.business.groupBy({
      by: ['city_id'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })
  ]);
  const cities = await db.location.findMany({
    where: { id: { in: topCities.map((c) => c.city_id) } }
  });
  return json({
    places,
    locations,
    categories,
    leads,
    pendingPlaces,
    pendingReviews,
    active,
    recent,
    searches,
    clicks,
    statuses,
    topCities: topCities.map((c) => ({
      name: cities.find((l) => l.id === c.city_id)?.name || String(c.city_id),
      count: c._count.id
    }))
  });
}
