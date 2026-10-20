import {
  findLocationById,
  findLocationBySlug,
  findLocationByName,
  findLocationAlias,
  findLocationAliases,
  searchLocationAliases,
  findLocationCandidates,
  findLocationChildren,
  findLocationAncestors,
  findLocationDescendants,
  findCityByName,
  findLocalityByName,
  type LocationRow,
  type LocationAliasRow,
  type LocationCandidateRow,
  type LocationType
} from '@/client-app/server/repositories/search/locationSearchRepository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationResolveInput {
  text: string;
  cityId?: bigint;
  districtId?: bigint;
  stateId?: bigint;
  countryId?: bigint;
  type?: LocationType;
  limit?: number;
  withAncestors?: boolean;
  includeInactive?: boolean;
}

export interface ResolvedLocation {
  id: bigint;
  name: string;
  slug: string;
  type: LocationType;
  parentId: bigint | null;
  isActive: boolean;
  score: number;
  ancestors?: ResolvedLocation[];
}

export type RankedLocationCandidate = ResolvedLocation;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCATION_TYPES: readonly LocationType[] = [
  'COUNTRY',
  'STATE',
  'DISTRICT',
  'CITY',
  'LOCALITY',
  'LANDMARK'
];

/** Minimum fuzzy score when matching the full input text. */
const MIN_SCORE_FULL = 0.45;
/** Stricter minimum when matching only a fragment of a longer input. */
const MIN_SCORE_FRAGMENT = 0.7;

/** Filler words stripped when building fragments from long inputs. */
const STOPWORDS = new Set([
  'in',
  'near',
  'at',
  'around',
  'nearby',
  'of',
  'the',
  'to',
  'from',
  'by',
  'and',
  'or',
  'for',
  'on'
]);

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export class LocationResolver {
  // -------------------------------------------------------------------------
  // Public entry point
  // -------------------------------------------------------------------------

  async resolve(input: unknown): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;

    // A city suffix disambiguates localities with the same name in different cities.
    if (!parsed.cityId) {
      const words = parsed.text.split(' ');
      for (let split = 1; split < words.length; split++) {
        const city = await findCityByName(words.slice(split).join(' '));
        if (!city) continue;
        const scoped = await this.resolveInScope(
          words.slice(0, split).join(' '),
          parsed,
          BigInt(city.id),
          MIN_SCORE_FULL,
          new Map()
        );
        if (scoped) return this.hydrate(parsed, scoped);
      }
    }

    const variants = this.textVariants(parsed.text);
    const scopes = this.scopesOf(parsed);
    const subtreeCache = new Map<string, Set<string>>();

    // Longest variant first (the full text), then smaller fragments.
    for (const variant of variants) {
      const minScore = variant === parsed.text ? MIN_SCORE_FULL : MIN_SCORE_FRAGMENT;

      // 1. Inside the supplied context (city > district > state > country).
      for (const scopeId of scopes) {
        const hit = await this.resolveInScope(variant, parsed, scopeId, minScore, subtreeCache);
        if (hit) return this.hydrate(parsed, hit);
      }

      // 2. Globally.
      const global = await this.resolveGlobal(variant, parsed, minScore);
      if (global) return this.hydrate(parsed, global);
    }

    return null;
  }

  async resolveById(id: bigint): Promise<ResolvedLocation | null> {
    const row = await findLocationById(id);
    return row?.isActive ? this.toResolved(row, 1) : null;
  }

  // -------------------------------------------------------------------------
  // Ambiguous / disambiguation
  // -------------------------------------------------------------------------

  async resolveAmbiguousLocation(input: unknown): Promise<RankedLocationCandidate[]> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return [];

    const limit = parsed.limit ?? 5;
    const scopes = this.scopesOf(parsed);
    const cache = new Map<string, Set<string>>();

    // Fetch more than needed, because scope filtering happens in-process.
    const rows = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      limit: scopes.length ? 100 : limit
    });

    let ids: Set<string> | null = null;
    if (scopes.length) {
      ids = await this.subtreeIds(scopes[0], cache);
    }

    return rows
      .filter((r) => this.accepts(r, parsed))
      .filter((r) => !ids || ids.has(this.idKey(r.id)))
      .slice(0, limit)
      .map((r) => this.toResolved(r, r.score));
  }

  // -------------------------------------------------------------------------
  // Alias resolvers
  // -------------------------------------------------------------------------

  async resolveLocationAlias(text: string): Promise<ResolvedLocation | null> {
    const exact = await findLocationAlias(text);
    if (exact) return this.toResolved(exact, 1.0);

    const [fuzzy] = await findLocationCandidates(text, { limit: 1 });
    return fuzzy && fuzzy.score >= MIN_SCORE_FULL ? this.toResolved(fuzzy, fuzzy.score) : null;
  }

  async resolveExactLocationAlias(text: string): Promise<ResolvedLocation | null> {
    const row = await findLocationAlias(text);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveFuzzyLocationAlias(input: unknown): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;

    const [best] = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      limit: 1
    });

    if (!best || best.score < MIN_SCORE_FULL) return null;
    return this.toResolved(best, best.score);
  }

  // -------------------------------------------------------------------------
  // Name / slug resolvers
  // -------------------------------------------------------------------------

  async resolveLocationByName(name: string): Promise<ResolvedLocation | null> {
    const row = await findLocationByName(name);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveLocationBySlug(slug: string): Promise<ResolvedLocation | null> {
    const row = await findLocationBySlug(slug);
    return row ? this.toResolved(row, 0.99) : null;
  }

  // -------------------------------------------------------------------------
  // Aliases list (for autocomplete / debug)
  // -------------------------------------------------------------------------

  async listLocationAliases(locationId: bigint): Promise<LocationAliasRow[]> {
    return findLocationAliases(locationId);
  }

  // -------------------------------------------------------------------------
  // Candidate discovery + ranking
  // -------------------------------------------------------------------------

  async findLocationCandidates(
    text: string,
    opts?: { type?: LocationType; parentId?: bigint; limit?: number }
  ): Promise<RankedLocationCandidate[]> {
    const rows = await findLocationCandidates(text, opts ?? {});
    return rows.map((c) => this.toResolved(c, c.score));
  }

  /**
   * Re-ranks an already-fetched candidate list against a new query string
   * without hitting the DB.
   */
  rankLocationCandidates(
    candidates: RankedLocationCandidate[],
    query: string
  ): RankedLocationCandidate[] {
    const q = this.normalize(query);
    if (!q) return candidates;

    return candidates
      .map((c) => {
        const name = this.normalize(c.name);
        const slug = this.normalize(c.slug);
        let score = c.score;

        if (name === q) score = Math.max(score, 1.0);
        else if (slug === q) score = Math.max(score, 0.99);
        else if (name.startsWith(q)) score = Math.max(score, 0.9);
        else if (name.includes(q)) score = Math.max(score, 0.8);

        return { ...c, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  // -------------------------------------------------------------------------
  // Hierarchy
  // -------------------------------------------------------------------------

  /** Root-first chain, including the node itself as the last element. */
  async resolveLocationHierarchy(locationId: bigint): Promise<ResolvedLocation[]> {
    const rows = await findLocationAncestors(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveLocationChildren(locationId: bigint): Promise<ResolvedLocation[]> {
    const rows = await findLocationChildren(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveLocationDescendants(locationId: bigint): Promise<ResolvedLocation[]> {
    const rows = await findLocationDescendants(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveParentLocation(locationId: bigint): Promise<ResolvedLocation | null> {
    const node = await findLocationById(locationId);
    if (!node || node.parentId === null || node.parentId === undefined) {
      return null;
    }
    const parent = await findLocationById(BigInt(node.parentId));
    return parent ? this.toResolved(parent, 1.0) : null;
  }

  async validateLocationHierarchy(input: { childId: bigint; parentId: bigint }): Promise<boolean> {
    if (this.sameId(input.childId, input.parentId)) return false;
    return this.isUnder(input.childId, input.parentId);
  }

  // -------------------------------------------------------------------------
  // Type-specific resolvers
  // -------------------------------------------------------------------------

  async resolveCity(input: unknown): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;
    const row = await findCityByName(parsed.text);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveDistrict(input: unknown): Promise<ResolvedLocation | null> {
    return this.resolveByType(input, 'DISTRICT');
  }

  async resolveLocality(input: unknown): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;
    const row = await findLocalityByName(parsed.text, parsed.cityId);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveLandmark(input: unknown): Promise<ResolvedLocation | null> {
    return this.resolveByType(input, 'LANDMARK');
  }

  private async resolveByType(
    input: unknown,
    type: LocationType
  ): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;
    return this.resolve({ ...parsed, type });
  }

  // -------------------------------------------------------------------------
  // Context-aware convenience wrappers
  // -------------------------------------------------------------------------

  async resolveLocationWithCityContext(
    text: string,
    cityId: bigint,
    type?: LocationType
  ): Promise<ResolvedLocation | null> {
    return this.resolve({ text, cityId, type });
  }

  async resolveLocationWithDistrictContext(
    text: string,
    districtId: bigint,
    type?: LocationType
  ): Promise<ResolvedLocation | null> {
    return this.resolve({ text, districtId, type });
  }

  // -------------------------------------------------------------------------
  // Core matching
  // -------------------------------------------------------------------------

  /** Exact alias → exact name → exact slug → fuzzy, across the whole table. */
  private async resolveGlobal(
    text: string,
    parsed: LocationResolveInput,
    minScore: number
  ): Promise<ResolvedLocation | null> {
    const aliasHit = await findLocationAlias(text);
    if (aliasHit && this.accepts(aliasHit, parsed)) {
      return this.toResolved(aliasHit, 1.0);
    }

    const nameHit = await findLocationByName(text);
    if (nameHit && this.accepts(nameHit, parsed)) {
      return this.toResolved(nameHit, 1.0);
    }

    const slugHit = await findLocationBySlug(text);
    if (slugHit && this.accepts(slugHit, parsed)) {
      return this.toResolved(slugHit, 0.99);
    }

    const candidates = await findLocationCandidates(text, {
      type: parsed.type,
      limit: 5
    });
    const best = candidates.find((c) => this.accepts(c, parsed));

    if (!best || best.score < minScore) return null;
    return this.toResolved(best, best.score);
  }

  /** Same as global, but restricted to descendants of `rootId`. */
  private async resolveInScope(
    text: string,
    parsed: LocationResolveInput,
    rootId: bigint,
    minScore: number,
    cache: Map<string, Set<string>>
  ): Promise<ResolvedLocation | null> {
    const ids = await this.subtreeIds(rootId, cache);
    if (ids.size === 0) return null;

    // Exact alias inside the subtree.
    const aliases = await searchLocationAliases(text);
    for (const alias of aliases) {
      if (this.normalize(alias.text) !== text) continue;
      if (!ids.has(this.idKey(alias.locationId))) continue;

      const loc = await findLocationById(BigInt(alias.locationId));
      if (loc && this.accepts(loc, parsed)) {
        return this.toResolved(loc, 0.98);
      }
    }

    // Name / slug / fuzzy inside the subtree. Candidates are fetched
    // globally (the repo's parentId filter is direct-children only), then
    // filtered by the real subtree.
    const candidates = await findLocationCandidates(text, {
      type: parsed.type,
      limit: 50
    });

    const inScope = candidates.filter((c) => ids.has(this.idKey(c.id)) && this.accepts(c, parsed));

    const exact = inScope.find((c) => this.normalize(c.name) === text || c.slug === text);
    if (exact) return this.toResolved(exact, 1.0);

    const best = inScope[0];
    if (!best || best.score < minScore) return null;
    return this.toResolved(best, best.score);
  }

  // -------------------------------------------------------------------------
  // Hierarchy helpers
  // -------------------------------------------------------------------------

  /** IDs of every descendant of `rootId` (excluding the root itself). */
  private async subtreeIds(rootId: bigint, cache: Map<string, Set<string>>): Promise<Set<string>> {
    const key = this.idKey(rootId);
    const cached = cache.get(key);
    if (cached) return cached;

    const rows = await findLocationDescendants(rootId);
    const ids = new Set<string>();
    for (const r of rows) {
      const k = this.idKey(r.id);
      if (k !== key) ids.add(k);
    }

    cache.set(key, ids);
    return ids;
  }

  private async isUnder(locationId: bigint, ancestorId: bigint): Promise<boolean> {
    if (this.sameId(locationId, ancestorId)) return true;
    const ancestors = await findLocationAncestors(locationId);
    return ancestors.some((a) => this.sameId(a.id, ancestorId));
  }

  /** Context ids ordered from most to least specific. */
  private scopesOf(parsed: LocationResolveInput): bigint[] {
    return [parsed.cityId, parsed.districtId, parsed.stateId, parsed.countryId].filter(
      (v): v is bigint => v !== undefined
    );
  }

  // -------------------------------------------------------------------------
  // Small helpers
  // -------------------------------------------------------------------------

  private accepts(row: LocationRow, parsed: LocationResolveInput): boolean {
    if (!parsed.includeInactive && !row.isActive) return false;
    if (parsed.type && String(row.type).toUpperCase() !== parsed.type) {
      return false;
    }
    return true;
  }

  /** Normalizes DB rows so ids are always bigint and type is always uppercase. */
  private toResolved(row: LocationRow | LocationCandidateRow, score: number): ResolvedLocation {
    return {
      id: BigInt(row.id),
      name: row.name,
      slug: row.slug,
      type: String(row.type).toUpperCase() as LocationType,
      parentId: row.parentId === null || row.parentId === undefined ? null : BigInt(row.parentId),
      isActive: row.isActive,
      score
    };
  }

  private async hydrate(
    parsed: LocationResolveInput,
    match: ResolvedLocation
  ): Promise<ResolvedLocation> {
    if (parsed.withAncestors) {
      match.ancestors = await this.resolveLocationHierarchy(match.id);
    }
    return match;
  }

  private idKey(id: bigint | number | string): string {
    return String(id);
  }

  private sameId(a: bigint | number | string, b: bigint | number | string): boolean {
    return String(a) === String(b);
  }

  private normalize(text: string): string {
    return text
      .replace(/[,;|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('en-IN');
  }

  /**
   * "hakim para siliguri" → ["hakim para siliguri", "hakim para",
   * "para siliguri", "hakim", "para", "siliguri"].
   * Stopwords are dropped first so "near sevoke road" yields "sevoke road".
   */
  private textVariants(text: string): string[] {
    const tokens = text
      .split(' ')
      .filter((t) => t && !STOPWORDS.has(t))
      .slice(0, 6);

    const variants: string[] = [text];
    const seen = new Set<string>(variants);

    for (let len = tokens.length; len >= 1; len--) {
      for (let i = 0; i + len <= tokens.length; i++) {
        const v = tokens.slice(i, i + len).join(' ');
        // Skip very short single tokens, since they match too loosely.
        if (len === 1 && v.length < 3) continue;
        if (!seen.has(v)) {
          seen.add(v);
          variants.push(v);
        }
      }
    }
    return variants;
  }

  private toBigInt(v: unknown): bigint | undefined {
    if (typeof v === 'bigint') return v;
    if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) {
      return BigInt(v);
    }
    if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
      return BigInt(v.trim());
    }
    return undefined;
  }

  private toType(v: unknown): LocationType | undefined {
    if (typeof v !== 'string') return undefined;
    const t = v.trim().toUpperCase() as LocationType;
    return LOCATION_TYPES.includes(t) ? t : undefined;
  }

  private normalizeInput(input: unknown): LocationResolveInput | null {
    if (typeof input === 'string') {
      const text = this.normalize(input);
      return text ? { text } : null;
    }

    if (!input || typeof input !== 'object') return null;

    const c = input as {
      text?: unknown;
      query?: unknown;
      parsed?: { locations?: unknown };
      cityId?: unknown;
      districtId?: unknown;
      stateId?: unknown;
      countryId?: unknown;
      type?: unknown;
      limit?: unknown;
      withAncestors?: unknown;
      includeInactive?: unknown;
    };

    // Prefer explicit text, then query, then the first parsed location term.
    const rawText =
      c.text ??
      c.query ??
      (Array.isArray(c.parsed?.locations)
        ? c.parsed.locations.find((l): l is string => typeof l === 'string' && l.trim().length > 0)
        : undefined);

    if (typeof rawText !== 'string') return null;

    const text = this.normalize(rawText);
    if (!text) return null;

    return {
      text,
      cityId: this.toBigInt(c.cityId),
      districtId: this.toBigInt(c.districtId),
      stateId: this.toBigInt(c.stateId),
      countryId: this.toBigInt(c.countryId),
      type: this.toType(c.type),
      limit:
        typeof c.limit === 'number' && Number.isFinite(c.limit)
          ? Math.max(1, Math.floor(c.limit))
          : undefined,
      withAncestors: typeof c.withAncestors === 'boolean' ? c.withAncestors : undefined,
      includeInactive: typeof c.includeInactive === 'boolean' ? c.includeInactive : undefined
    };
  }
}

// Convenience singleton
export const locationResolver = new LocationResolver();
