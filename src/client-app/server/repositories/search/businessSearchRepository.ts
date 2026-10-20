import type { SearchFilters } from '@/client-app/shared/searchFilters';
import { Prisma } from '@/generated/prisma/client';
import { db } from '@/client-app/lib/db';

export type BusinessSearchRow = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  cityId: number;
  localityId: number | null;
  rating: number | null;
  reviewCount: number;
  openNow?: boolean;
  distanceKm?: number | null;
};

type RawBusinessRow = {
  id: bigint | number;
  name: string;
  slug: string;
  address: string | null;
  cityId: bigint | number | null;
  localityId: bigint | number | null;
  rating: number | string | null;
  reviewCount: number | bigint;
  openNow?: boolean;
  distanceKm?: number | null;
};

const BUSINESS_SELECT = Prisma.sql`
  SELECT
    b.id,
    b.name,
    b.slug,
    b.address,
    b.city_id AS "cityId",
    b.locality_id AS "localityId",
    b.rating,
    b.review_count AS "reviewCount"
  FROM business b
`;

function mapRows(rows: RawBusinessRow[]): BusinessSearchRow[] {
  return rows.map((row) => ({
    openNow: row.openNow,
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    address: row.address,
    cityId: Number(row.cityId ?? 0),
    localityId: row.localityId == null ? null : Number(row.localityId),
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: Number(row.reviewCount),
    distanceKm: row.distanceKm == null ? null : Number(row.distanceKm)
  }));
}

async function queryBusinesses(sql: Prisma.Sql): Promise<BusinessSearchRow[]> {
  const rows = await db.$queryRaw<RawBusinessRow[]>(sql);
  return mapRows(rows);
}

function uniqueIds(ids: bigint[]): bigint[] {
  return [...new Set(ids.map(String))].map((id) => BigInt(id));
}

// -----------------------------------------------------------------------------
// Business lookup
// -----------------------------------------------------------------------------

export async function findBusinessById(id: bigint): Promise<BusinessSearchRow | null> {
  const rows = await queryBusinesses(
    Prisma.sql`${BUSINESS_SELECT} WHERE b.id = ${id} AND b.status = 'active' LIMIT 1`
  );

  return rows[0] ?? null;
}

export async function findBusinessBySlug(slug: string): Promise<BusinessSearchRow | null> {
  const rows = await queryBusinesses(
    Prisma.sql`${BUSINESS_SELECT} WHERE b.slug = ${slug} AND b.status = 'active' LIMIT 1`
  );

  return rows[0] ?? null;
}

export async function findBusinessByPhone(phone: string): Promise<BusinessSearchRow | null> {
  const rows = await queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE regexp_replace(COALESCE(b.phone, ''), '[^0-9]', '', 'g')
          = regexp_replace(${phone}, '[^0-9]', '', 'g')
        AND b.status = 'active'
      LIMIT 1
    `
  );

  return rows[0] ?? null;
}

export async function findBusinessBySourceRef(
  source: string,
  sourceRef: string
): Promise<BusinessSearchRow | null> {
  const rows = await queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.source = ${source}
        AND b.source_ref = ${sourceRef}
        AND b.status = 'active'
      LIMIT 1
    `
  );

  return rows[0] ?? null;
}

// -----------------------------------------------------------------------------
// Name search
// -----------------------------------------------------------------------------

export async function searchBusinessesByName(query: string): Promise<BusinessSearchRow[]> {
  const normalized = query.trim();

  if (!normalized) return [];

  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.status = 'active'
        AND (
          b.name ILIKE ${normalized}
          OR b.name ILIKE ${`%${normalized}%`}
        )
      ORDER BY
        CASE WHEN LOWER(b.name) = LOWER(${normalized}) THEN 0 ELSE 1 END,
        b.name
      LIMIT 100
    `
  );
}

export async function searchBusinessesByNameFuzzy(query: string): Promise<BusinessSearchRow[]> {
  const normalized = query.trim();

  if (!normalized) return [];

  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.status = 'active'
        AND similarity(b.name, ${normalized}) >= 0.2
      ORDER BY similarity(b.name, ${normalized}) DESC, b.name
      LIMIT 100
    `
  );
}

// -----------------------------------------------------------------------------
// Concept searches
// -----------------------------------------------------------------------------

export async function findBusinessesByConcept(conceptId: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_concept bc ON bc.business_id = b.id
      WHERE bc.concept_id = ${conceptId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByConceptTree(
  conceptIds: bigint[]
): Promise<BusinessSearchRow[]> {
  const ids = uniqueIds(conceptIds.filter((id) => typeof id === 'bigint' && id > 0n));

  if (ids.length === 0) {
    return [];
  }

  return queryBusinesses(
    Prisma.sql`
      WITH RECURSIVE concept_tree AS (
        -- Selected concepts
        SELECT id, parent_id
        FROM concept
        WHERE id IN (${Prisma.join(ids)})
          AND is_active = true

        UNION

        -- Include ancestors of the selected concepts
        SELECT parent.id, parent.parent_id
        FROM concept parent
        INNER JOIN concept_tree child
          ON child.parent_id = parent.id
        WHERE parent.is_active = true
      ),
      matched_businesses AS (
        SELECT DISTINCT bc.business_id
        FROM business_concept bc
        INNER JOIN concept_tree ct
          ON ct.id = bc.concept_id
      )
      ${BUSINESS_SELECT}
      INNER JOIN matched_businesses mb
        ON mb.business_id = b.id
      WHERE b.status = 'active'
      ORDER BY b.name ASC
      LIMIT 500
    `
  );
}
// -----------------------------------------------------------------------------
// Location searches
// -----------------------------------------------------------------------------

export async function findBusinessesByLocation(locationId: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_location bl ON bl.business_id = b.id
      WHERE bl.location_id = ${locationId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByLocality(localityId: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.locality_id = ${localityId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByCity(cityId: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.city_id = ${cityId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesWithinRadius(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<BusinessSearchRow[]> {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(radiusMeters) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    radiusMeters <= 0
  ) {
    throw new Error('Invalid coordinates or radius');
  }

  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.status = 'active'
        AND b.geom IS NOT NULL
        AND ST_DWithin(
          b.geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY ST_Distance(
        b.geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      )
      LIMIT 500
    `
  );
}

// -----------------------------------------------------------------------------
// Attribute searches
// -----------------------------------------------------------------------------

export async function findBusinessesByAttribute(attributeId: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_attribute_value bav ON bav.business_id = b.id
      WHERE bav.attribute_id = ${attributeId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByAttributeOption(
  attributeId: bigint,
  optionId: bigint
): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_attribute_value bav ON bav.business_id = b.id
      WHERE bav.attribute_id = ${attributeId}
        AND bav.option_id = ${optionId}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByBooleanAttribute(
  attributeId: bigint,
  value: boolean
): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_attribute_value bav ON bav.business_id = b.id
      WHERE bav.attribute_id = ${attributeId}
        AND bav.boolean_value = ${value}
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByNumberAttribute(
  attributeId: bigint,
  min?: number,
  max?: number
): Promise<BusinessSearchRow[]> {
  if (min !== undefined && !Number.isFinite(min)) {
    throw new Error('min must be a finite number');
  }

  if (max !== undefined && !Number.isFinite(max)) {
    throw new Error('max must be a finite number');
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error('min cannot be greater than max');
  }

  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_attribute_value bav ON bav.business_id = b.id
      WHERE bav.attribute_id = ${attributeId}
        AND bav.number_value IS NOT NULL
        AND (${min ?? null}::double precision IS NULL OR bav.number_value >= ${min ?? null})
        AND (${max ?? null}::double precision IS NULL OR bav.number_value <= ${max ?? null})
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

export async function findBusinessesByChoiceAttribute(
  attributeId: bigint,
  optionIds: bigint[]
): Promise<BusinessSearchRow[]> {
  const ids = uniqueIds(optionIds);

  if (ids.length === 0) return [];

  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_attribute_value bav ON bav.business_id = b.id
      WHERE bav.attribute_id = ${attributeId}
        AND bav.option_id IN (${Prisma.join(ids)})
        AND b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

// -----------------------------------------------------------------------------
// Opening hours
// -----------------------------------------------------------------------------

export async function findBusinessesOpenNow(cityId?: bigint): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      INNER JOIN business_hours bh ON bh.business_id = b.id
      WHERE b.status = 'active'
        AND (${cityId ?? null}::bigint IS NULL OR b.city_id = ${cityId ?? null})
        AND bh.day_of_week = EXTRACT(DOW FROM CURRENT_TIMESTAMP)::integer
        AND bh.open_time <= LOCALTIME
        AND bh.close_time > LOCALTIME
      ORDER BY b.name
      LIMIT 500
    `
  );
}

// -----------------------------------------------------------------------------
// All active businesses
// -----------------------------------------------------------------------------

export async function findActiveBusinesses(): Promise<BusinessSearchRow[]> {
  return queryBusinesses(
    Prisma.sql`
      ${BUSINESS_SELECT}
      WHERE b.status = 'active'
      ORDER BY b.name
      LIMIT 500
    `
  );
}

/**
 * Location
 */
export async function findParentCityIdForLocality(localityId: bigint): Promise<number | null> {
  if (localityId <= 0n) {
    return null;
  }

  const rows = await db.$queryRaw<Array<{ cityId: bigint | number | null }>>(
    Prisma.sql`
      SELECT parent_id AS "cityId"
      FROM location
      WHERE id = ${localityId}
        AND level = 'LOCALITY'
        AND is_active = true
      LIMIT 1
    `
  );

  const rawCityId = rows[0]?.cityId;

  if (rawCityId == null) {
    return null;
  }

  const cityId = Number(rawCityId);

  return Number.isSafeInteger(cityId) && cityId > 0 ? cityId : null;
}

/** Match concept descendants and the selected location subtree in the same query. */
export async function searchMatchingBusinesses(
  input: SearchFilters & {
    conceptIds: number[];
    query: string;
    locationId?: number;
    locationUnresolved: boolean;
    page: number;
    perPage: number;
    userLocation?: { lat: number; lng: number };
    locationOnly?: boolean;
  }
): Promise<{ businesses: BusinessSearchRow[]; total: number }> {
  if (input.locationUnresolved) return { businesses: [], total: 0 };
  const conceptFilter = input.locationOnly
    ? Prisma.sql`TRUE`
    : input.conceptIds.length
      ? Prisma.sql`EXISTS (
        SELECT 1 FROM business_concept bc
        JOIN concept_tree ct ON ct.id = bc.concept_id
        WHERE bc.business_id = b.id
      )`
      : Prisma.sql`(b.name_norm LIKE '%' || norm_text(${input.query}) || '%'
        OR similarity(b.name_norm, norm_text(${input.query})) >= 0.3)`;
  const locationFilter = input.locationId
    ? Prisma.sql`(b.city_id IN (SELECT id FROM location_tree)
        OR b.locality_id IN (SELECT id FROM location_tree))`
    : Prisma.sql`TRUE`;
  const categoryNames: Record<string, string[]> = {
    restaurants: ['restaurant', 'restaurants'],
    cafes: ['cafe', 'cafes', 'coffee shop', 'coffee shops'],
    fastFood: ['fast food', 'fast food restaurant', 'fast food restaurants']
  };
  const names = input.categories.flatMap((category) => categoryNames[category] ?? []);
  const categoryFilter = names.length
    ? Prisma.sql`EXISTS (
    SELECT 1 FROM business_concept bc JOIN category_tree ct ON ct.id = bc.concept_id
    WHERE bc.business_id = b.id
  )`
    : Prisma.sql`TRUE`;
  const vegFilter = input.pureVeg
    ? Prisma.sql`EXISTS (
    SELECT 1 FROM business_attribute ba JOIN attribute a ON a.id = ba.attribute_id
    WHERE ba.business_id = b.id AND a.is_active = TRUE
      AND (a.slug IN ('pure-veg', 'pure-vegetarian', 'vegetarian', 'pure_veg')
        OR lower(a.name) IN ('pure veg', 'pure vegetarian', 'vegetarian'))
  )`
    : Prisma.sql`TRUE`;
  // Hours use Sunday=0, with overnight intervals belonging to their opening day.
  const localNow = Prisma.sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')`;
  const openNow = Prisma.sql`(b.is_24x7 OR EXISTS (
    SELECT 1 FROM business_hours bh WHERE bh.business_id = b.id AND (
      (bh.weekday = EXTRACT(DOW FROM ${localNow})::integer
        AND bh.open_time <= ${localNow}::time
        AND (bh.close_time > ${localNow}::time OR bh.close_time < bh.open_time))
      OR (bh.weekday = (EXTRACT(DOW FROM ${localNow})::integer + 6) % 7
        AND bh.close_time < bh.open_time AND bh.close_time > ${localNow}::time)
    )
  ))`;
  const availabilityFilter = input.openNow ? openNow : Prisma.sql`TRUE`;
  const ratingFilter = input.minRating
    ? Prisma.sql`b.rating >= ${input.minRating}`
    : Prisma.sql`TRUE`;
  const radiusFilter =
    input.distance && input.userLocation
      ? Prisma.sql`ST_DWithin(
    b.geom::geography,
    ST_SetSRID(ST_MakePoint(${input.userLocation.lng}, ${input.userLocation.lat}), 4326)::geography,
    ${input.distance * 1000}
  )`
      : Prisma.sql`TRUE`;
  const filters = Prisma.sql`${categoryFilter} AND ${vegFilter} AND ${availabilityFilter} AND ${ratingFilter} AND ${radiusFilter}`;
  const order =
    input.sort === 'distance' || (input.sort === 'auto' && input.userLocation)
      ? Prisma.sql`"distanceKm" ASC NULLS LAST, b.rating DESC, b.review_count DESC`
      : input.sort === 'reviews'
        ? Prisma.sql`b.review_count DESC, b.rating DESC`
        : input.sort === 'rating'
          ? Prisma.sql`b.rating DESC, b.review_count DESC`
          : Prisma.sql`similarity(b.name_norm, norm_text(${input.query})) DESC NULLS LAST, b.rating DESC, b.review_count DESC`;
  const cte = Prisma.sql`
    WITH RECURSIVE category_tree AS (
      SELECT id FROM concept WHERE is_active = TRUE AND
        ${names.length ? Prisma.sql`(lower(name) IN (${Prisma.join(names)}) OR replace(slug, '-', ' ') IN (${Prisma.join(names)}))` : Prisma.sql`FALSE`}
      UNION
      SELECT c.id FROM concept c JOIN category_tree parent ON c.parent_id = parent.id WHERE c.is_active = TRUE
    ), concept_tree AS (
      SELECT id FROM concept
      WHERE ${input.conceptIds.length ? Prisma.sql`id IN (${Prisma.join(input.conceptIds)})` : Prisma.sql`FALSE`}
        AND is_active = TRUE
      UNION
      SELECT c.id FROM concept c JOIN concept_tree parent ON c.parent_id = parent.id
      WHERE c.is_active = TRUE
    ), location_tree AS (
      SELECT id FROM location WHERE id = ${input.locationId ?? null} AND is_active = TRUE
      UNION
      SELECT l.id FROM location l JOIN location_tree parent ON l.parent_id = parent.id
      WHERE l.is_active = TRUE
    )`;
  const distance = input.userLocation
    ? Prisma.sql`ST_Distance(b.geom::geography,
        ST_SetSRID(ST_MakePoint(${input.userLocation.lng}, ${input.userLocation.lat}), 4326)::geography) / 1000.0`
    : Prisma.sql`NULL::double precision`;
  const orderedSelect = Prisma.sql`
    SELECT b.id, b.name, b.slug, b.address, b.city_id AS "cityId",
      b.locality_id AS "localityId", b.rating, b.review_count AS "reviewCount",
      ${distance} AS "distanceKm", ${openNow} AS "openNow"
    FROM business b`;
  // A transaction keeps the total and the page consistent under concurrent writes.
  const [counts, rows] = await db.$transaction(
    [
      db.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`${cte}
      SELECT COUNT(*) AS total FROM business b
      WHERE b.status = 'active' AND ${conceptFilter} AND ${locationFilter} AND ${filters}`),
      db.$queryRaw<RawBusinessRow[]>(Prisma.sql`${cte} ${orderedSelect}
      WHERE b.status = 'active' AND ${conceptFilter} AND ${locationFilter} AND ${filters}
      ORDER BY ${order}, b.name ASC, b.id ASC
      LIMIT ${input.perPage} OFFSET ${(input.page - 1) * input.perPage}`)
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );
  return { businesses: mapRows(rows), total: Number(counts[0]?.total ?? 0) };
}
