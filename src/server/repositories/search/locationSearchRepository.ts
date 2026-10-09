import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocationType =
  "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "LOCALITY" | "LANDMARK";

export interface LocationRow {
  id: bigint;
  name: string;
  slug: string;
  type: LocationType;
  parentId: bigint | null;
  isActive: boolean;
}

export interface LocationAliasRow {
  id: bigint;
  locationId: bigint;
  text: string;
  language: string | null;
}

export interface LocationCandidateRow extends LocationRow {
  score: number;
}

// ---------------------------------------------------------------------------
// Core lookups
// ---------------------------------------------------------------------------

export async function findLocationById(
  id: bigint,
): Promise<LocationRow | null> {
  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE l.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationBySlug(
  slug: string,
): Promise<LocationRow | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE l.slug = ${normalized}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationByName(
  name: string,
): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
    ORDER BY
      -- prefer more specific types when names collide
      CASE l.type
        WHEN 'CITY' THEN 1
        WHEN 'LOCALITY' THEN 2
        WHEN 'LANDMARK' THEN 3
        WHEN 'DISTRICT' THEN 4
        WHEN 'STATE' THEN 5
        WHEN 'COUNTRY' THEN 6
        ELSE 7
      END
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Aliases
// ---------------------------------------------------------------------------

export async function findLocationAlias(
  text: string,
): Promise<LocationRow | null> {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location_alias AS a
    JOIN location AS l ON l.id = a.location_id
    WHERE LOWER(TRIM(a.text)) = ${normalized}
      AND l.is_active = TRUE
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocationAliases(
  locationId: bigint,
): Promise<LocationAliasRow[]> {
  return db.$queryRaw<LocationAliasRow[]>`
    SELECT
      a.id,
      a.location_id AS "locationId",
      a.text,
      a.language
    FROM location_alias AS a
    WHERE a.location_id = ${locationId}
    ORDER BY a.text ASC
  `;
}

export async function searchLocationAliases(
  text: string,
): Promise<LocationAliasRow[]> {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];

  return db.$queryRaw<LocationAliasRow[]>`
    SELECT DISTINCT
      a.id,
      a.location_id AS "locationId",
      a.text,
      a.language
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
// Candidate discovery (used by the resolver's ambiguous path)
// ---------------------------------------------------------------------------

export async function findLocationCandidates(
  text: string,
  opts: {
    type?: LocationType;
    parentId?: bigint;
    limit?: number;
  } = {},
): Promise<LocationCandidateRow[]> {
  const normalized = text.trim().toLocaleLowerCase("en-IN");
  if (!normalized) return [];

  // Protect the database from invalid or excessive limits.
  const limit = Math.max(1, Math.min(Math.floor(opts.limit ?? 25), 100));

  return db.$queryRaw<LocationCandidateRow[]>`
    SELECT
      l.id,
      l.name,
      l.slug,
      l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive",
      MAX(
        CASE
          WHEN LOWER(TRIM(l.name)) = ${normalized} THEN 1.00
          WHEN l.slug = ${normalized} THEN 0.99
          WHEN a.text = ${normalized} THEN 0.98

          WHEN LOWER(TRIM(l.name)) LIKE ${normalized} || '%' THEN 0.90
          WHEN a.text LIKE ${normalized} || '%' THEN 0.88
          WHEN l.slug LIKE ${normalized} || '%' THEN 0.85

          WHEN LOWER(TRIM(l.name)) LIKE '%' || ${normalized} || '%' THEN 0.80

          WHEN a.text % ${normalized}
            THEN similarity(a.text, ${normalized}) * 0.85

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
      ${
        opts.type
          ? Prisma.sql`AND l.type = ${opts.type}::"LocationType"`
          : Prisma.empty
      }
      ${
        opts.parentId !== undefined
          ? Prisma.sql`AND l.parent_id = ${opts.parentId}`
          : Prisma.empty
      }
      AND (
        LOWER(TRIM(l.name)) = ${normalized}
        OR l.slug = ${normalized}
        OR a.text = ${normalized}

        OR LOWER(TRIM(l.name)) LIKE ${normalized} || '%'
        OR a.text LIKE ${normalized} || '%'
        OR l.slug LIKE ${normalized} || '%'

        OR LOWER(TRIM(l.name)) LIKE '%' || ${normalized} || '%'
        OR a.text % ${normalized}

        OR similarity(LOWER(TRIM(l.name)), ${normalized}) >= 0.25
      )
    GROUP BY
      l.id,
      l.name,
      l.slug,
      l.type,
      l.parent_id,
      l.is_active
    ORDER BY
      score DESC,
      l.name ASC
    LIMIT ${limit}
  `;
}

// ---------------------------------------------------------------------------
// Hierarchy navigation
// ---------------------------------------------------------------------------

export async function findLocationChildren(
  locationId: bigint,
): Promise<LocationRow[]> {
  return db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE l.parent_id = ${locationId}
      AND l.is_active = TRUE
    ORDER BY l.name ASC
  `;
}

export async function findLocationAncestors(
  locationId: bigint,
): Promise<LocationRow[]> {
  // Walks UP to the root. Returned root-first.
  return db.$queryRaw<LocationRow[]>`
    WITH RECURSIVE ancestry AS (
      SELECT
        id, name, slug, type, parent_id, is_active,
        0 AS depth
      FROM location
      WHERE id = ${locationId}
      UNION ALL
      SELECT
        l.id, l.name, l.slug, l.type, l.parent_id, l.is_active,
        a.depth + 1
      FROM location AS l
      JOIN ancestry AS a ON l.id = a.parent_id
    )
    SELECT
      id, name, slug, type,
      parent_id AS "parentId",
      is_active AS "isActive"
    FROM ancestry
    ORDER BY depth DESC
  `;
}

export async function findLocationDescendants(
  locationId: bigint,
): Promise<LocationRow[]> {
  // Walks DOWN the tree. Includes the root as depth 0.
  return db.$queryRaw<LocationRow[]>`
    WITH RECURSIVE descendants AS (
      SELECT
        id, name, slug, type, parent_id, is_active,
        0 AS depth
      FROM location
      WHERE id = ${locationId}
      UNION ALL
      SELECT
        l.id, l.name, l.slug, l.type, l.parent_id, l.is_active,
        d.depth + 1
      FROM location AS l
      JOIN descendants AS d ON d.id = l.parent_id
    )
    SELECT
      id, name, slug, type,
      parent_id AS "parentId",
      is_active AS "isActive"
    FROM descendants
    ORDER BY depth ASC, name ASC
  `;
}

// ---------------------------------------------------------------------------
// Type-specific finders
// ---------------------------------------------------------------------------

export async function findCityByName(
  name: string,
): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE l.type = 'CITY'::"LocationType"
      AND LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLocalityByName(
  name: string,
  cityId?: bigint,
): Promise<LocationRow | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db.$queryRaw<LocationRow[]>`
    SELECT
      l.id, l.name, l.slug, l.type,
      l.parent_id AS "parentId",
      l.is_active AS "isActive"
    FROM location AS l
    WHERE l.type = 'LOCALITY'::"LocationType"
      AND LOWER(TRIM(l.name)) = ${normalized}
      AND l.is_active = TRUE
      ${cityId ? Prisma.sql`AND l.parent_id = ${cityId}` : Prisma.empty}
    ORDER BY l.name ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
