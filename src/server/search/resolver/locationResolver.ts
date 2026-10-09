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
  type LocationType,
} from "@/server/repositories/search/locationSearchRepository";

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

export interface RankedLocationCandidate {
  id: bigint;
  name: string;
  slug: string;
  type: LocationType;
  parentId: bigint | null;
  isActive: boolean;
  score: number;
}

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

    // 1. Resolve using the supplied city context.
    if (parsed.cityId !== undefined) {
      const ctx = await this.resolveInContext(parsed, parsed.cityId);

      if (ctx && this.accepts(ctx, parsed)) {
        return this.hydrate(parsed, ctx);
      }
    }

    // 2. Resolve using the supplied district context.
    if (parsed.districtId !== undefined) {
      const ctx = await this.resolveInContext(parsed, parsed.districtId);

      if (ctx && this.accepts(ctx, parsed)) {
        return this.hydrate(parsed, ctx);
      }
    }

    // 3. Exact alias.
    const aliasHit = await findLocationAlias(parsed.text);

    if (aliasHit && this.accepts(aliasHit, parsed)) {
      return this.hydrate(parsed, this.toResolved(aliasHit, 1.0));
    }

    // 4. Exact name.
    const nameHit = await findLocationByName(parsed.text);

    if (nameHit && this.accepts(nameHit, parsed)) {
      return this.hydrate(parsed, this.toResolved(nameHit, 1.0));
    }

    // 5. Exact slug.
    const slugHit = await findLocationBySlug(parsed.text);

    if (slugHit && this.accepts(slugHit, parsed)) {
      return this.hydrate(parsed, this.toResolved(slugHit, 0.99));
    }

    // 6. Fuzzy candidate search.
    const [best] = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      parentId: parsed.cityId ?? parsed.districtId,
      limit: 1,
    });

    // Don't accept weak fuzzy matches.
    if (!best || best.score < 0.45 || !this.accepts(best, parsed)) {
      return null;
    }

    return this.hydrate(parsed, this.toResolved(best, best.score));
  }

  // -------------------------------------------------------------------------
  // Ambiguous / disambiguation
  // -------------------------------------------------------------------------

  async resolveAmbiguousLocation(
    input: unknown,
  ): Promise<RankedLocationCandidate[]> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return [];

    const candidates = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      parentId: parsed.cityId ?? parsed.districtId ?? undefined,
      limit: parsed.limit ?? 5,
    });

    return candidates
      .filter((c) => this.accepts(c, parsed))
      .map((c) => this.toResolved(c, c.score));
  }

  // -------------------------------------------------------------------------
  // Alias resolvers
  // -------------------------------------------------------------------------

  async resolveLocationAlias(text: string): Promise<ResolvedLocation | null> {
    const exact = await findLocationAlias(text);
    if (exact) return this.toResolved(exact, 1.0);

    const [fuzzy] = await findLocationCandidates(text, { limit: 1 });
    return fuzzy ? this.toResolved(fuzzy, fuzzy.score) : null;
  }

  async resolveExactLocationAlias(
    text: string,
  ): Promise<ResolvedLocation | null> {
    const row = await findLocationAlias(text);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveFuzzyLocationAlias(
    text: string,
  ): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(text);
    if (!parsed) return null;

    const [best] = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      parentId: parsed.cityId ?? parsed.districtId,
      limit: 1,
    });

    if (!best || best.score < 0.45) {
      return null;
    }

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
    opts?: { type?: LocationType; parentId?: bigint; limit?: number },
  ): Promise<RankedLocationCandidate[]> {
    const rows = await findLocationCandidates(text, opts ?? {});
    return rows.map((c) => this.toResolved(c, c.score));
  }

  /**
   * Re-ranks an already-fetched candidate list against a new query string
   * without hitting the DB. Useful when the caller has a cached list and
   * wants to re-order it for a different query.
   */
  rankLocationCandidates(
    candidates: RankedLocationCandidate[],
    query: string,
  ): RankedLocationCandidate[] {
    const q = this.normalize(query);
    if (!q) return candidates;

    const scored = candidates.map((c) => {
      const name = this.normalize(c.name);
      const slug = this.normalize(c.slug);
      let score = c.score;

      if (name === q) score = Math.max(score, 1.0);
      else if (slug === q) score = Math.max(score, 0.99);
      else if (name.startsWith(q)) score = Math.max(score, 0.9);
      else if (name.includes(q)) score = Math.max(score, 0.8);

      return { ...c, score };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  // -------------------------------------------------------------------------
  // Hierarchy
  // -------------------------------------------------------------------------

  async resolveLocationHierarchy(
    locationId: bigint,
  ): Promise<ResolvedLocation[]> {
    const rows = await findLocationAncestors(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveLocationChildren(
    locationId: bigint,
  ): Promise<ResolvedLocation[]> {
    const rows = await findLocationChildren(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveLocationDescendants(
    locationId: bigint,
  ): Promise<ResolvedLocation[]> {
    const rows = await findLocationDescendants(locationId);
    return rows.map((r) => this.toResolved(r, 1.0));
  }

  async resolveParentLocation(
    locationId: bigint,
  ): Promise<ResolvedLocation | null> {
    const ancestors = await findLocationAncestors(locationId);
    // findLocationAncestors returns root-first; the immediate parent is last-but-one
    // because the array's last element is the node itself.
    const parent =
      ancestors.length >= 2 ? ancestors[ancestors.length - 2] : null;
    return parent ? this.toResolved(parent, 1.0) : null;
  }

  async validateLocationHierarchy(input: {
    childId: bigint;
    parentId: bigint;
  }): Promise<boolean> {
    if (input.childId === input.parentId) return false;

    const ancestors = await findLocationAncestors(input.childId);
    return ancestors.some((a) => a.id === input.parentId);
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
    return this.resolveByType(input, "DISTRICT");
  }

  async resolveLocality(input: unknown): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;
    const row = await findLocalityByName(parsed.text, parsed.cityId);
    return row ? this.toResolved(row, 1.0) : null;
  }

  async resolveLandmark(input: unknown): Promise<ResolvedLocation | null> {
    return this.resolveByType(input, "LANDMARK");
  }

  private async resolveByType(
    input: unknown,
    type: LocationType,
  ): Promise<ResolvedLocation | null> {
    const parsed = this.normalizeInput(input);
    if (!parsed) return null;

    const [best] = await findLocationCandidates(parsed.text, {
      type,
      parentId: parsed.cityId ?? parsed.districtId ?? undefined,
      limit: 1,
    });
    return best ? this.toResolved(best, best.score) : null;
  }

  // -------------------------------------------------------------------------
  // Context-aware resolution
  // -------------------------------------------------------------------------

  async resolveLocationWithCityContext(
    text: string,
    cityId: bigint,
    type?: LocationType,
  ): Promise<ResolvedLocation | null> {
    return this.resolveWithParentContext({ text, cityId, type }, cityId);
  }

  async resolveLocationWithDistrictContext(
    text: string,
    districtId: bigint,
    type?: LocationType,
  ): Promise<ResolvedLocation | null> {
    return this.resolveWithParentContext(
      { text, districtId, type },
      districtId,
    );
  }

  private async resolveWithParentContext(
    parsed: LocationResolveInput,
    parentId: bigint,
  ): Promise<ResolvedLocation | null> {
    const [best] = await findLocationCandidates(parsed.text, {
      type: parsed.type,
      parentId,
      limit: 1,
    });
    return best ? this.toResolved(best, best.score) : null;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async resolveInContext(
    parsed: LocationResolveInput,
    parentId: bigint,
  ): Promise<ResolvedLocation | null> {
    // Exact alias inside the context subtree
    const aliasHit = await this.exactInSubtree(parsed.text, parentId);
    if (aliasHit) return this.toResolved(aliasHit, 0.98);

    // Exact name inside the context subtree
    const nameHit = await this.exactNameInSubtree(parsed.text, parentId);
    if (nameHit) return this.toResolved(nameHit, 1.0);

    // Fuzzy inside the context subtree
    const [fuzzy] = await findLocationCandidates(parsed.text, {
      parentId,
      type: parsed.type,
      limit: 1,
    });
    return fuzzy ? this.toResolved(fuzzy, fuzzy.score) : null;
  }

  /**
   * Find a location under `parentId` whose exact name or alias matches `text`.
   * Uses the descendants walk and filters in-process; fine for shallow trees.
   * If trees get deep, promote this to a dedicated repo query.
   */
  private async exactInSubtree(
    text: string,
    parentId: bigint,
  ): Promise<LocationRow | null> {
    const q = this.normalize(text);
    if (!q) return null;

    // Try alias first via searchLocationAliases, then filter by ancestor chain
    const aliases = await searchLocationAliases(q);
    for (const alias of aliases) {
      if (this.normalize(alias.text) !== q) continue;
      const loc = await findLocationById(alias.locationId);
      if (!loc) continue;
      if (await this.isUnder(loc.id, parentId)) return loc;
    }
    return null;
  }

  private async exactNameInSubtree(
    text: string,
    parentId: bigint,
  ): Promise<LocationRow | null> {
    const candidates = await findLocationCandidates(text, {
      parentId,
      limit: 10,
    });
    const q = this.normalize(text);
    return candidates.find((c) => this.normalize(c.name) === q) ?? null;
  }

  private async isUnder(
    locationId: bigint,
    ancestorId: bigint,
  ): Promise<boolean> {
    if (locationId === ancestorId) return true;
    const ancestors = await findLocationAncestors(locationId);
    return ancestors.some((a) => a.id === ancestorId);
  }

  private accepts(row: LocationRow, parsed: LocationResolveInput): boolean {
    if (!parsed.includeInactive && !row.isActive) return false;
    if (parsed.type && row.type !== parsed.type) return false;
    return true;
  }

  private toResolved(
    row: LocationRow | LocationCandidateRow,
    score: number,
  ): ResolvedLocation {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      parentId: row.parentId,
      isActive: row.isActive,
      score,
    };
  }

  private async hydrate(
    parsed: LocationResolveInput,
    match: ResolvedLocation,
  ): Promise<ResolvedLocation> {
    if (parsed.withAncestors) {
      match.ancestors = await this.resolveLocationHierarchy(match.id);
    }
    return match;
  }

  private normalize(text: string): string {
    return text.trim().toLocaleLowerCase("en-IN");
  }

  private normalizeInput(input: unknown): LocationResolveInput | null {
    if (typeof input === "string") {
      const text = this.normalize(input);
      return text ? { text } : null;
    }
    if (input && typeof input === "object") {
      const c = input as Partial<LocationResolveInput>;
      const text = this.normalize(String(c.text ?? ""));
      if (!text) return null;
      return {
        text,
        cityId: c.cityId,
        districtId: c.districtId,
        stateId: c.stateId,
        countryId: c.countryId,
        type: c.type,
        limit: c.limit,
        withAncestors: c.withAncestors,
        includeInactive: c.includeInactive,
      };
    }
    return null;
  }
}

// Convenience singleton
export const locationResolver = new LocationResolver();
