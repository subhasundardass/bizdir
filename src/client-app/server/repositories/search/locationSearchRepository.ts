import { Prisma } from '@/generated/prisma/client';
import { db } from '@/client-app/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocationType = 'COUNTRY' | 'STATE' | 'DISTRICT' | 'CITY' | 'LOCALITY' | 'LANDMARK';

export interface LocationRow {
  id: bigint;
  name: string;
  slug: string;
  type: LocationType;
  parentId: bigint | null;
  isActive: boolean;
}

export interface LocationAliasRow {
  locationId: bigint;
  text: string;
  language: string | null;
}

export interface LocationCandidateRow extends LocationRow {
  score: number;
}

// ---------------------------------------------------------------------------
// Shared SQL fragments (DB column is `level`, values are lowercase)
// ---------------------------------------------------------------------------

const LOCATION_COLUMNS = Prisma.sql`
  l.id,
  l.name,
  l.slug,
  UPPER(l.level::text) AS type,
  l.parent_id AS "parentId",
  l.is_active AS "isActive"
`;

// ---------------------------------------------------------------------------
// Core lookups
// ---------------------------------------------------------------------------

export async function findLocationById(id: bigint): Promise<LocationRow | null> {
  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE l.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationBySlug(slug: string): Promise<LocationRow | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE l.slug = ${normalized}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationByName(name: string): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
    ORDER BY
      CASE l.level::text
        WHEN 'city' THEN 1
        WHEN 'locality' THEN 2
        WHEN 'landmark' THEN 3
        WHEN 'district' THEN 4
        WHEN 'state' THEN 5
        WHEN 'country' THEN 6
        ELSE 7
      END
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Aliases
// ---------------------------------------------------------------------------

export async function findLocationAlias(text: string): Promise<LocationRow | null> {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location_alias AS a
    JOIN location AS l ON l.id = a.location_id
    WHERE LOWER(TRIM(a.text)) = ${normalized}
      AND l.is_active = TRUE
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationAliases(locationId: bigint): Promise<LocationAliasRow[]> {
  return db.$queryRaw<LocationAliasRow[]>`
    SELECT
      a.location_id AS "locationId",
      a.text,
      NULL::text AS language
    FROM location_alias AS a
    WHERE a.location_id = ${locationId}
    ORDER BY a.text ASC
  `;
}

export async function searchLocationAliases(text: string): Promise<LocationAliasRow[]> {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];

  return db.$queryRaw<LocationAliasRow[]>`
    SELECT DISTINCT
      a.location_id AS "locationId",
      a.text,
      NULL::text AS language
    FROM location_alias AS a
    JOIN location AS l ON l.id = a.location_id
    WHERE l.is_active = TRUE
      AND (
        LOWER(TRIM(a.text)) = ${normalized}
        OR LOWER(TRIM(a.text)) LIKE ${normalized} || '%'
        OR LOWER(a.text) % ${normalized}
      )
    ORDER BY a.text ASC
    LIMIT 25
  `;
}

// ---------------------------------------------------------------------------
// Candidate discovery
// ---------------------------------------------------------------------------

export async function findLocationCandidates(
  text: string,
  opts: {
    type?: LocationType;
    parentId?: bigint;
    limit?: number;
  } = {}
): Promise<LocationCandidateRow[]> {
  const normalized = text.trim().toLocaleLowerCase('en-IN');
  if (!normalized) return [];

  const limit = Math.max(1, Math.min(Math.floor(opts.limit ?? 25), 100));

  return db.$queryRaw<LocationCandidateRow[]>`
    SELECT
      l.id,
      l.name,
      l.slug,
      UPPER(l.level::text) AS type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive",
      MAX(
        CASE
          WHEN LOWER(TRIM(l.name)) = ${normalized} THEN 1.00
          WHEN l.slug = ${normalized} THEN 0.99
          WHEN LOWER(TRIM(a.text)) = ${normalized} THEN 0.98

          WHEN LOWER(TRIM(l.name)) LIKE ${normalized} || '%' THEN 0.90
          WHEN LOWER(TRIM(a.text)) LIKE ${normalized} || '%' THEN 0.88
          WHEN l.slug LIKE ${normalized} || '%' THEN 0.85

          WHEN LOWER(TRIM(l.name)) LIKE '%' || ${normalized} || '%' THEN 0.80

          WHEN LOWER(a.text) % ${normalized}
            THEN similarity(LOWER(a.text), ${normalized}) * 0.85

          WHEN similarity(LOWER(TRIM(l.name)), ${normalized}) >= 0.25
            THEN similarity(LOWER(TRIM(l.name)), ${normalized}) * 0.70

          ELSE 0
        END
      )::float8 AS score
    FROM location AS l
    LEFT JOIN location_alias AS a
      ON a.location_id = l.id
    WHERE
      l.is_active = TRUE
      ${opts.type ? Prisma.sql`AND l.level::text = ${opts.type.toLowerCase()}` : Prisma.empty}
      ${opts.parentId !== undefined ? Prisma.sql`AND l.parent_id = ${opts.parentId}` : Prisma.empty}
      AND (
        LOWER(TRIM(l.name)) = ${normalized}
        OR l.slug = ${normalized}
        OR LOWER(TRIM(a.text)) = ${normalized}

        OR LOWER(TRIM(l.name)) LIKE ${normalized} || '%'
        OR LOWER(TRIM(a.text)) LIKE ${normalized} || '%'
        OR l.slug LIKE ${normalized} || '%'

        OR LOWER(TRIM(l.name)) LIKE '%' || ${normalized} || '%'
        OR LOWER(a.text) % ${normalized}

        OR similarity(LOWER(TRIM(l.name)), ${normalized}) >= 0.25
      )
    GROUP BY
      l.id, l.name, l.slug, l.level, l.parent_id, l.is_active
    ORDER BY
      score DESC,
      l.name ASC
    LIMIT ${limit}
  `;
}

// ---------------------------------------------------------------------------
// Hierarchy navigation
// ---------------------------------------------------------------------------

export async function findLocationChildren(locationId: bigint): Promise<LocationRow[]> {
  return db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE l.parent_id = ${locationId}
      AND l.is_active = TRUE
    ORDER BY l.name ASC
  `;
}

export async function findLocationAncestors(locationId: bigint): Promise<LocationRow[]> {
  // Walks UP to the root. Returned root-first.
  return db.$queryRaw<LocationRow[]>`
    WITH RECURSIVE ancestry AS (
      SELECT id, name, slug, level, parent_id, is_active, 0 AS depth
      FROM location
      WHERE id = ${locationId}
      UNION ALL
      SELECT l.id, l.name, l.slug, l.level, l.parent_id, l.is_active, a.depth + 1
      FROM location AS l
      JOIN ancestry AS a ON l.id = a.parent_id
    )
    SELECT
      id, name, slug,
      UPPER(level::text) AS type,
      parent_id AS "parentId",
      is_active AS "isActive"
    FROM ancestry
    ORDER BY depth DESC
  `;
}

export async function findLocationDescendants(locationId: bigint): Promise<LocationRow[]> {
  // Walks DOWN the tree. Includes the root as depth 0.
  return db.$queryRaw<LocationRow[]>`
    WITH RECURSIVE descendants AS (
      SELECT id, name, slug, level, parent_id, is_active, 0 AS depth
      FROM location
      WHERE id = ${locationId}
      UNION ALL
      SELECT l.id, l.name, l.slug, l.level, l.parent_id, l.is_active, d.depth + 1
      FROM location AS l
      JOIN descendants AS d ON d.id = l.parent_id
    )
    SELECT
      id, name, slug,
      UPPER(level::text) AS type,
      parent_id AS "parentId",
      is_active AS "isActive"
    FROM descendants
    ORDER BY depth ASC, name ASC
  `;
}

// ---------------------------------------------------------------------------
// Type-specific finders
// ---------------------------------------------------------------------------

export async function findCityByName(name: string): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE l.level::text = 'city'
      AND LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocalityByName(
  name: string,
  cityId?: bigint
): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT ${LOCATION_COLUMNS}
    FROM location AS l
    WHERE l.level::text = 'locality'
      AND LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
      ${cityId ? Prisma.sql`AND l.parent_id = ${cityId}` : Prisma.empty}
    ORDER BY l.name ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
