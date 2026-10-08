export type ParserTier = "rules" | "fuzzy" | "llm";

export type SearchIntent =
  | "business_search"
  | "category_search"
  | "service_search"
  | "navigation"
  | "direct_business"
  | "near_me"
  | "information"
  | "unknown";

export type ConceptMatchType = "exact" | "alias" | "fuzzy" | "parent" | "child";

export type LocationLevel =
  "state" | "district" | "city" | "locality" | "landmark";

export type AttributeValue = boolean | number | string | string[];

export type SearchFilters = {
  priceLevel?: number[];
  minRating?: number;
  maxDistanceKm?: number;
  openNow?: boolean;
  twentyFourSeven?: boolean;
  verified?: boolean;
  attributes?: Record<string, AttributeValue>;
};

export type ConceptMatch = {
  conceptId: bigint;
  name?: string;
  slug?: string;
  matchType: ConceptMatchType;
  confidence: number;
  score?: number;
};

export type LocationMatch = {
  locationId: bigint;
  name?: string;
  slug?: string;
  level: LocationLevel;
  confidence: number;
  distanceKm?: number;
};

export type SearchUserLocation = {
  lat: number;
  lng: number;
};

export type SearchQuery = {
  rawQuery: string;
  normalizedQuery: string;
  intent: SearchIntent;
  concepts: ConceptMatch[];
  location?: LocationMatch;
  filters: SearchFilters;
  userLocation?: SearchUserLocation;
  parserTier: ParserTier;
  confidence: number;
};

export type ParsedSearchQuery = {
  originalQuery: string;
  intent: {
    type: "business_search" | "unknown";
    confidence: number;
  };
  concepts: string[];
  locations: string[];
  attributes: string[];
  filters: {
    openNow?: boolean;
    best?: boolean;
  };
  remainingTokens: string[];
};

export type SearchCandidate = {
  businessId: bigint;
  conceptScore: number;
  locationScore: number;
  distanceScore: number;
  attributeScore: number;
  qualityScore: number;
  ratingScore: number;
  verificationScore: number;
  popularityScore: number;
  freshnessScore: number;
  subscriptionScore: number;
  totalScore?: number;
  distanceKm?: number;
  layer?: SearchResultLayer;
};

export type SearchResultLayer = "organic" | "featured" | "sponsored";

export type SearchResult = {
  businessId: bigint;
  slug: string;
  name: string;
  address: string;
  cityId: bigint;
  localityId?: bigint;
  phone: string;
  whatsapp?: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  verified: boolean;
  priceLevel?: number;
  is24x7: boolean;
  distanceKm?: number;
  layer: SearchResultLayer;
  position: number;
  score: number;
  highlights: string[];
};

export type SearchResponse = {
  searchId: bigint;
  query: SearchQuery;
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  nextCursor?: string;
  tookMs: number;
};

export type SearchContext = {
  query: SearchQuery;
  startedAt: number;
  cityId?: bigint;
};

export type SearchCursor = {
  score: number;
  businessId: bigint;
};

export type SearchImpression = {
  searchId: bigint;
  businessId: bigint;
  position: number;
  layer: SearchResultLayer;
};

export type SearchClickAction =
  "view" | "call" | "whatsapp" | "direction" | "share" | "enquiry";

export type SearchAction = {
  searchId?: bigint;
  businessId: bigint;
  action: SearchClickAction;
  position?: number;
  sessionId?: string;
};

export type SearchClick = SearchAction;

export type SearchLogData = {
  sessionId?: string;
  rawQuery: string;
  normalizedQuery: string;
  parsed: ParsedSearchQuery;
  cityId?: bigint;
  userLat?: number;
  userLng?: number;
  resultCount: number;
  tookMs: number;
};

export type SearchPagination = {
  page: number;
  pageSize: number;
  cursor?: string;
};

export type SearchOptions = {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sessionId?: string;
  userLocation?: SearchUserLocation;
};
