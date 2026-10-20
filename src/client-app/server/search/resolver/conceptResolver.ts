import type { ParsedSearchQuery } from '../parser/parseSearchQuery';
import {
  conceptSearchRepository,
  type ConceptSearchMatch
} from '@/client-app/server/repositories/search/conceptSearchRepository';

export type ResolvedConcept = {
  id: number;
  name: string;
  slug: string;
  type: 'category' | 'service';
  score: number;
};

export type ConceptResolveInput = {
  query: string;
  tokens: string[];
  parsed: ParsedSearchQuery;
};

export class ConceptResolver {
  /**
   * Resolve the concepts found in a parsed search query.
   *
   * Example:
   *
   * "best ac repair near hakim para siliguri"
   *
   * parsed.concepts:
   *   ["ac", "repair", "hakim", "para", "siliguri"]
   *
   * The resolver tries to find actual concepts from the
   * concept/alias database.
   */
  async resolve(input: ConceptResolveInput): Promise<ResolvedConcept[]> {
    const conceptMatches = await this.findConceptMatches(input);

    return this.rankConceptMatches(conceptMatches);
  }

  /**
   * Find possible concepts from the database.
   */
  private async findConceptMatches(input: ConceptResolveInput): Promise<ConceptSearchMatch[]> {
    const concepts = [
      ...new Set(
        input.parsed.concepts
          .map((concept) => concept.trim().toLocaleLowerCase('en-IN'))
          .filter(Boolean)
      )
    ];

    if (concepts.length === 0) {
      return [];
    }

    /*
     * First search using the complete parsed concept tokens.
     *
     * Example:
     *
     * ["ac", "repair"]
     *
     * becomes:
     *
     * "ac repair"
     */
    const searchText = concepts.join(' ').trim();

    if (!searchText) {
      return [];
    }

    return conceptSearchRepository.search({
      query: searchText,
      tokens: concepts
    });
  }

  /**
   * Rank concept matches.
   *
   * A concept can match through:
   *
   * - exact name
   * - alias
   * - partial text
   * - fuzzy match
   *
   * Exact matches should eventually receive the highest score.
   */
  private rankConceptMatches(matches: ConceptSearchMatch[]): ResolvedConcept[] {
    return matches
      .map((match) => ({
        id: match.id,
        name: match.name,
        slug: match.slug,
        type: match.type,
        score: match.score
      }))
      .sort((a, b) => b.score - a.score);
  }
}

export const conceptResolver = new ConceptResolver();
