import { db } from "@/lib/db";

export type ConceptSearchMatch = {
  id: number;
  name: string;
  slug: string;
  type: "category" | "service";
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
    const query = input.query.trim();

    if (!query) {
      return [];
    }

    const normalizedQuery = query.toLocaleLowerCase("en-IN");

    const concepts = await db.concept.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });

    const matches: ConceptSearchMatch[] = [];

    for (const concept of concepts) {
      const name = concept.name.toLocaleLowerCase("en-IN").trim();

      const slug = concept.slug.toLocaleLowerCase("en-IN").trim();

      const score = this.calculateScore({
        query: normalizedQuery,
        name,
        slug,
      });

      if (score > 0) {
        matches.push({
          id: concept.id,
          name: concept.name,
          slug: concept.slug,
          type: concept.type as "category" | "service",
          score,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, 20);
  }

  /**
   * Calculate a simple concept-name match score.
   *
   * This is intentionally basic.
   *
   * Later we can replace this with:
   *
   * - alias matching
   * - token matching
   * - PostgreSQL trigram similarity
   * - exact phrase matching
   * - fuzzy matching
   */
  private calculateScore(input: {
    query: string;
    name: string;
    slug: string;
  }): number {
    const { query, name, slug } = input;

    if (name === query) {
      return 1;
    }

    if (slug === query) {
      return 0.98;
    }

    if (name.startsWith(query)) {
      return 0.9;
    }

    if (name.includes(query)) {
      return 0.8;
    }

    if (slug.includes(query)) {
      return 0.7;
    }

    const queryTokens = query.split(/\s+/).filter(Boolean);

    const matchedTokens = queryTokens.filter(
      (token) => name.includes(token) || slug.includes(token),
    );

    if (matchedTokens.length === 0) {
      return 0;
    }

    return 0.4 * (matchedTokens.length / queryTokens.length);
  }
}

export const conceptSearchRepository = new ConceptSearchRepository();
