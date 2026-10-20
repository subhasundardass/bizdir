import { db } from '@/client-app/lib/db';

export type ConceptSearchMatch = {
  id: number;
  name: string;
  slug: string;
  type: 'category' | 'service';
  score: number;
};

export type ConceptSearchInput = {
  query: string;
  tokens: string[];
};

class ConceptSearchRepository {
  /**
   * Find concepts matching the supplied search text.
   *
   * This repository only talks to the database.
   *
   * Search interpretation belongs to ConceptResolver.
   */
  async search(input: ConceptSearchInput): Promise<ConceptSearchMatch[]> {
    const query = input.query.trim().toLocaleLowerCase('en-IN');

    if (!query) {
      return [];
    }

    const matches = await db.$queryRaw<ConceptSearchMatch[]>`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.type,
      MAX(
        CASE
          -- Exact concept name
          WHEN LOWER(TRIM(c.name)) = ${query} THEN 1.00

          -- Exact slug
          WHEN c.slug = ${query} THEN 0.99

          -- Exact alias
          WHEN a.text = ${query} THEN 0.98

          -- Concept name starts with the query
          WHEN LOWER(TRIM(c.name)) LIKE ${query} || '%' THEN 0.90

          -- Alias starts with the query
          WHEN a.text LIKE ${query} || '%' THEN 0.88

          -- Slug starts with the query
          WHEN c.slug LIKE ${query} || '%' THEN 0.85

          -- Query appears inside the concept name
          WHEN LOWER(TRIM(c.name)) LIKE '%' || ${query} || '%' THEN 0.80

          -- Fuzzy alias match using PostgreSQL pg_trgm
          WHEN a.text % ${query}
            THEN similarity(a.text, ${query}) * 0.85

          -- Fuzzy concept-name match
          WHEN similarity(LOWER(TRIM(c.name)), ${query}) >= 0.3
            THEN similarity(LOWER(TRIM(c.name)), ${query}) * 0.70

          ELSE 0
        END
      )::float8 AS score
      FROM concept AS c
      LEFT JOIN concept_alias AS a
        ON a.concept_id = c.id
      WHERE
        c.is_active = TRUE
        AND (
          LOWER(TRIM(c.name)) = ${query}
          OR c.slug = ${query}
          OR a.text = ${query}
          OR a.text LIKE ${query} || '%'
          OR c.slug LIKE ${query} || '%'
          OR LOWER(TRIM(c.name)) LIKE ${'%' + query + '%'}
          OR a.text % ${query}
          OR similarity(LOWER(TRIM(c.name)), ${query}) >= 0.3
        )
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.type
      ORDER BY
        score DESC,
        c.name ASC
      LIMIT 20
    `;

    return matches;
  }
}

export const conceptSearchRepository = new ConceptSearchRepository();
