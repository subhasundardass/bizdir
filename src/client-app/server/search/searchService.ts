import { parseSearchFilters, type SearchFilters } from '@/client-app/shared/searchFilters';
import { normalizeSearchQuery } from './parser/normalizeSearchQuery';
import { tokenizeSearchQuery } from './parser/tokenizeSearchQuery';
import { parseSearchQuery, type ParsedSearchQuery } from './parser/parseSearchQuery';
import { conceptResolver } from './resolver/conceptResolver';
import { locationResolver } from './resolver/locationResolver';
import { searchMatchingBusinesses } from '@/client-app/server/repositories/search/businessSearchRepository';
import type { ResolvedLocation } from './resolver/locationResolver';

export type SearchInput = SearchFilters & {
  query: string;
  page: number;
  perPage: number;
  location?: string;
  locationId?: number;
  userLocation?: { lat: number; lng: number };
};

export type SearchContext = SearchFilters & {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  parsed: ParsedSearchQuery;
  page: number;
  perPage: number;
  location?: string;
  locationId?: number;
  userLocation?: { lat: number; lng: number };
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
  openNow?: boolean;
  distanceKm?: number | null;
};

export type SearchResult = {
  businesses: SearchBusinessResult[];
  total: number;
  page: number;
  perPage: number;

  location: { id: number; name: string } | null;
  locationUnresolved: boolean;
  debug?: {
    rawQuery: string;
    normalizedQuery: string;
    tokens: string[];
    parsed: SearchContext['parsed'];
    resolved: any;
  };
};

export type SearchSuggestion = {
  id: number;
  text: string;
  label: string;
  type: 'concept' | 'location' | 'business';
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
   * Search businesses.
   */
  async searchBusinesses(input: SearchInput | SearchContext): Promise<SearchResult> {
    const context = this.isSearchContext(input) ? input : await this.createSearchContext(input);

    const resolved = await this.resolveSearch(context);

    const result = await searchMatchingBusinesses({
      ...parseSearchFilters(context),
      conceptIds: resolved.concepts.map((concept) => concept.id),
      query: context.parsed.concepts.join(' ') || context.normalizedQuery,
      locationId: resolved.locations ? Number(resolved.locations.id) : undefined,
      locationUnresolved: resolved.locationUnresolved,
      page: context.page,
      perPage: context.perPage,
      userLocation: context.userLocation,
      locationOnly: resolved.locationOnly
    });
    return {
      ...result,
      page: context.page,
      perPage: context.perPage,
      location: resolved.locations
        ? { id: Number(resolved.locations.id), name: resolved.locations.name }
        : null,
      locationUnresolved: resolved.locationUnresolved
    };
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
      tokens
    });

    return {
      ...parseSearchFilters(data),
      rawQuery,
      normalizedQuery,
      tokens,
      parsed,
      page: data.page,
      perPage: data.perPage,
      location: data.location,
      locationId: data.locationId,
      userLocation: data.userLocation
    };
  }

  /**
   * Resolve concepts, locations and filters.
   */

  private async resolveSearch(context: SearchContext) {
    const locationText = context.location || context.parsed.locations.join(' ');
    let locations: ResolvedLocation | null = null;
    if (context.locationId) {
      locations = await locationResolver.resolveById(BigInt(context.locationId));
    } else if (locationText) {
      locations = await locationResolver.resolve({ text: locationText });
    }
    const matches = await conceptResolver.resolve({
      query: context.normalizedQuery,
      tokens: context.tokens,
      parsed: context.parsed
    });
    // Strong phrase matches take precedence over loosely related concepts.
    const best = matches[0]?.score ?? 0;
    let concepts = matches.filter((match) => match.score >= Math.max(0.3, best - 0.08));
    let locationOnly = false;
    // A bare place name searches all services in that place.
    if (!locationText && !context.locationId && (matches[0]?.score ?? 0) < 0.9) {
      const place = await locationResolver.resolve({
        text: context.normalizedQuery
      });
      if (place && place.score >= 0.98) {
        locations = place;
        concepts = [];
        locationOnly = true;
      }
    } else if (locations && context.parsed.concepts.length === 0) {
      locationOnly = true;
    }
    return {
      locationOnly,
      concepts,
      locations,
      locationUnresolved: Boolean(locationText || context.locationId) && !locations
    };
  }

  /**
   * Search suggestions.
   */
  async suggestSearch(input: unknown): Promise<SearchSuggestion[]> {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid suggestion input');
    }

    const value = input as Record<string, unknown>;

    if (typeof value.query !== 'string') {
      throw new Error('Search query must be a string');
    }

    const query = normalizeSearchQuery(value.query);

    if (query.length < 2) {
      return [];
    }

    if (value.type === 'location') {
      const matches = await locationResolver.findLocationCandidates(query, {
        limit: 8
      });
      return Promise.all(
        matches.map(async (match) => {
          const ancestors = await locationResolver.resolveLocationHierarchy(match.id);
          const parentNames = ancestors
            .filter((node) => node.id !== match.id)
            .reverse()
            .slice(0, 2)
            .map((node) => node.name);
          return {
            id: Number(match.id),
            text: match.name,
            label: [match.name, ...parentNames].join(', '),
            type: 'location' as const
          };
        })
      );
    }
    const parsed = await parseSearchQuery({
      query,
      tokens: tokenizeSearchQuery(query)
    });
    const concepts = await conceptResolver.resolve({
      query,
      tokens: tokenizeSearchQuery(query),
      parsed
    });
    return concepts
      .filter((match) => match.score >= 0.3)
      .slice(0, 8)
      .map((match) => ({
        id: match.id,
        text: match.name,
        label: match.name,
        type: 'concept' as const
      }));
  }

  /**
   * Get a previously generated search result.
   */
  async getSearchResult(input: unknown) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid search result input');
    }

    const value = input as Record<string, unknown>;

    if (
      typeof value.searchId !== 'number' ||
      !Number.isInteger(value.searchId) ||
      value.searchId < 1
    ) {
      throw new Error('searchId must be a positive integer');
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
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid search click input');
    }

    /*
     * TODO:
     * searchLogRepository
     * clickLogging
     */

    return {
      success: true
    };
  }

  /**
   * Record an action originating from search.
   */
  async recordSearchAction(input: unknown) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid search action input');
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
      success: true
    };
  }

  /**
   * Validate search input.
   */
  private validateSearchInput(input: unknown): SearchInput {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid search input');
    }

    const value = input as Record<string, unknown>;

    if (typeof value.query !== 'string') {
      throw new Error('Search query must be a string');
    }

    const query = value.query.trim();

    if (query.length < 2) {
      throw new Error('Search query must contain at least 2 characters');
    }

    if (query.length > 300) {
      throw new Error('Search query must not exceed 300 characters');
    }

    const page = this.getPositiveInteger(value.page, 1, 'page');

    const perPage = this.getPositiveInteger(value.perPage, 20, 'perPage');

    if (perPage > 100) {
      throw new Error('perPage must not exceed 100');
    }

    if (
      value.location !== undefined &&
      (typeof value.location !== 'string' || value.location.length > 200)
    ) {
      throw new Error('Location must be a string of at most 200 characters');
    }
    const locationId =
      value.locationId === undefined
        ? undefined
        : this.getPositiveInteger(value.locationId, 1, 'locationId');
    let userLocation: { lat: number; lng: number } | undefined;
    if (value.userLocation !== undefined) {
      if (!value.userLocation || typeof value.userLocation !== 'object')
        throw new Error('Invalid user location');
      const coordinates = value.userLocation as Record<string, unknown>;
      const { lat, lng } = coordinates;
      if (
        typeof lat !== 'number' ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        typeof lng !== 'number' ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        throw new Error('Invalid user location coordinates');
      }
      userLocation = { lat, lng };
    }
    const filters = parseSearchFilters(value);
    if ((filters.distance || filters.sort === 'distance') && !userLocation) {
      throw new Error('Enable your location to filter or sort by distance');
    }
    return {
      ...filters,
      userLocation,
      query,
      page,
      perPage,
      location: (value.location as string | undefined)?.trim(),
      locationId
    };
  }

  /**
   * Convert an unknown value into a positive integer.
   */
  private getPositiveInteger(value: unknown, defaultValue: number, fieldName: string): number {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
      throw new Error(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  /**
   * Type guard for SearchContext.
   */
  private isSearchContext(input: SearchInput | SearchContext): input is SearchContext {
    return 'normalizedQuery' in input && 'tokens' in input && 'parsed' in input;
  }

  //
}

export const searchService = new SearchService();
