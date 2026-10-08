import { normalizeSearchQuery } from "./parser/normalizeSearchQuery";
import { tokenizeSearchQuery } from "./parser/tokenizeSearchQuery";
import {
  parseSearchQuery,
  type ParsedSearchQuery,
} from "./parser/parseSearchQuery";

export type SearchInput = {
  query: string;
  page: number;
  perPage: number;
};

export type SearchContext = {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  parsed: ParsedSearchQuery;
  page: number;
  perPage: number;
};

export type SearchBusinessResult = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  cityId: number;
  localityId: number | null;
  rating: number | null;
  reviewCount: number;
};

export type SearchResult = {
  businesses: SearchBusinessResult[];
  total: number;
  page: number;
  perPage: number;

  debug?: {
    rawQuery: string;
    normalizedQuery: string;
    tokens: string[];
    parsed: SearchContext["parsed"];
  };
};

export type SearchSuggestion = {
  text: string;
  type: "concept" | "location" | "business";
};

export class SearchService {
  /**
   * Complete search entry point.
   *
   * Input
   *   ↓
   * Context
   *   ↓
   * Resolve
   *   ↓
   * Retrieve
   *   ↓
   * Rank
   *   ↓
   * Paginate
   *   ↓
   * Result
   */
  async executeSearch(input: unknown): Promise<SearchResult> {
    const context = await this.createSearchContext(input);

    return this.searchBusinesses(context);
  }

  /**
   * Build the internal search context.
   */
  async createSearchContext(input: unknown): Promise<SearchContext> {
    const data = this.validateSearchInput(input);

    const rawQuery = data.query;

    const normalizedQuery = normalizeSearchQuery(rawQuery);

    const tokens = tokenizeSearchQuery(normalizedQuery);

    const parsed = await parseSearchQuery({
      query: normalizedQuery,
      tokens,
    });

    return {
      rawQuery,
      normalizedQuery,
      tokens,
      parsed,
      page: data.page,
      perPage: data.perPage,
    };
  }

  /**
   * Search businesses.
   */
  async searchBusinesses(
    input: SearchInput | SearchContext,
  ): Promise<SearchResult> {
    const context = this.isSearchContext(input)
      ? input
      : await this.createSearchContext(input);

    const resolved = await this.resolveSearch(context);

    const candidates = await this.retrieveCandidates({
      context,
      resolved,
    });

    const ranked = await this.rankCandidates({
      context,
      candidates,
    });

    const businesses = this.paginate(ranked, context.page, context.perPage);

    return {
      businesses,
      total: ranked.length,
      page: context.page,
      perPage: context.perPage,

      debug: {
        rawQuery: context.rawQuery,
        normalizedQuery: context.normalizedQuery,
        tokens: context.tokens,
        parsed: context.parsed,
      },
    };
  }

  /**
   * Resolve concepts, locations and filters.
   */
  private async resolveSearch(context: SearchContext) {
    /*
     * TODO:
     *
     * conceptResolver
     * locationResolver
     * attributeResolver
     * filterResolver
     */

    return {
      concepts: [],
      locations: [],
      attributes: [],
      filters: [],
    };
  }

  /**
   * Retrieve candidate businesses.
   */
  private async retrieveCandidates(input: {
    context: SearchContext;
    resolved: unknown;
  }): Promise<SearchBusinessResult[]> {
    /*
     * TODO:
     *
     * candidateRetrieval
     * businessRetrieval
     * nameRetrieval
     */

    return [];
  }

  /**
   * Rank candidate businesses.
   */
  private async rankCandidates(input: {
    context: SearchContext;
    candidates: SearchBusinessResult[];
  }): Promise<SearchBusinessResult[]> {
    /*
     * TODO:
     *
     * searchRanking
     * conceptRanking
     * locationRanking
     * qualityRanking
     * subscriptionRanking
     * diversityRanking
     */

    return input.candidates;
  }

  /**
   * Paginate ranked results.
   */
  private paginate(
    results: SearchBusinessResult[],
    page: number,
    perPage: number,
  ): SearchBusinessResult[] {
    const start = (page - 1) * perPage;

    return results.slice(start, start + perPage);
  }

  /**
   * Search suggestions.
   */
  async suggestSearch(input: unknown): Promise<SearchSuggestion[]> {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid suggestion input");
    }

    const value = input as Record<string, unknown>;

    if (typeof value.query !== "string") {
      throw new Error("Search query must be a string");
    }

    const query = normalizeSearchQuery(value.query);

    if (query.length < 2) {
      return [];
    }

    /*
     * TODO:
     *
     * Search:
     * - concept aliases
     * - location aliases
     * - business names
     */

    return [];
  }

  /**
   * Get a previously generated search result.
   */
  async getSearchResult(input: unknown) {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid search result input");
    }

    const value = input as Record<string, unknown>;

    if (
      typeof value.searchId !== "number" ||
      !Number.isInteger(value.searchId) ||
      value.searchId < 1
    ) {
      throw new Error("searchId must be a positive integer");
    }

    /*
     * TODO:
     * Load search result.
     */

    return null;
  }

  /**
   * Record a search result click.
   */
  async recordSearchClick(input: unknown) {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid search click input");
    }

    /*
     * TODO:
     * searchLogRepository
     * clickLogging
     */

    return {
      success: true,
    };
  }

  /**
   * Record an action originating from search.
   */
  async recordSearchAction(input: unknown) {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid search action input");
    }

    /*
     * TODO:
     *
     * call
     * whatsapp
     * direction
     * share
     * enquiry
     */

    return {
      success: true,
    };
  }

  /**
   * Validate search input.
   */
  private validateSearchInput(input: unknown): SearchInput {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid search input");
    }

    const value = input as Record<string, unknown>;

    if (typeof value.query !== "string") {
      throw new Error("Search query must be a string");
    }

    const query = value.query.trim();

    if (query.length < 2) {
      throw new Error("Search query must contain at least 2 characters");
    }

    if (query.length > 300) {
      throw new Error("Search query must not exceed 300 characters");
    }

    const page = this.getPositiveInteger(value.page, 1, "page");

    const perPage = this.getPositiveInteger(value.perPage, 20, "perPage");

    if (perPage > 100) {
      throw new Error("perPage must not exceed 100");
    }

    return {
      query,
      page,
      perPage,
    };
  }

  /**
   * Convert an unknown value into a positive integer.
   */
  private getPositiveInteger(
    value: unknown,
    defaultValue: number,
    fieldName: string,
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new Error(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  /**
   * Type guard for SearchContext.
   */
  private isSearchContext(
    input: SearchInput | SearchContext,
  ): input is SearchContext {
    return "normalizedQuery" in input && "tokens" in input && "parsed" in input;
  }
}

export const searchService = new SearchService();
