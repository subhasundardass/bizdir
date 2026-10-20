export type ParserTier = 'rules' | 'fuzzy' | 'llm';

export type ParsedSearchQuery = {
  originalQuery: string;

  intent: {
    type: 'business_search' | 'unknown';
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

  parserTier: 'rules' | 'fuzzy' | 'llm';

  confidence: number;
};

export type ParseSearchQueryInput = {
  query: string;
  tokens: string[];
};

export type ParserResult = {
  concepts: string[];
  locations: string[];
  attributes: string[];
  filters: ParsedSearchQuery['filters'];
  confidence: number;
};

const STOP_WORDS = new Set(['in', 'near', 'at', 'for', 'of', 'the', 'and']);

const INTENT_WORDS = new Set([
  'best',
  'top',
  'nearby',
  'shop',
  'shops',
  'business',
  'businesses',
  'service',
  'services'
]);

const ATTRIBUTE_WORDS = new Set(['open', 'today', '24x7', '24', 'hour', 'hours']);

/**
 * Main parser entry point.
 *
 * V1:
 * - Rule based parsing only.
 *
 * Later:
 * - rules
 * - fuzzy matching
 * - LLM fallback
 */
export async function parseSearchQuery(input: ParseSearchQueryInput): Promise<ParsedSearchQuery> {
  const tier = selectParserTier(input);

  let result: ParserResult;

  switch (tier) {
    case 'rules':
      result = await parseWithRules(input);
      break;

    case 'fuzzy':
      result = await parseWithFuzzyMatching(input);
      break;

    case 'llm':
      result = await parseWithLlm(input);
      break;

    default:
      result = await parseWithRules(input);
  }

  const parsed: ParsedSearchQuery = {
    originalQuery: input.query,

    intent: {
      type: input.query.trim().length > 0 ? 'business_search' : 'unknown',
      confidence: input.query.trim().length > 0 ? 0.8 : 0
    },

    concepts: result.concepts,
    locations: result.locations,
    attributes: result.attributes,
    filters: result.filters,
    remainingTokens: getRemainingTokens(input.tokens),
    parserTier: tier,
    confidence: result.confidence
  };

  validateParsedQuery(parsed);

  return parsed;
}

/**
 * Rule based parser.
 *
 * This is the V1 parser.
 */
export async function parseWithRules(input: ParseSearchQueryInput): Promise<ParserResult> {
  const lowerTokens = input.tokens.map((token) => token.toLocaleLowerCase('en-IN'));

  const filters: ParsedSearchQuery['filters'] = {};

  if (lowerTokens.includes('best') || lowerTokens.includes('top')) {
    filters.best = true;
  }

  if (lowerTokens.includes('open') && lowerTokens.includes('today')) {
    filters.openNow = true;
  }

  const locationStart = lowerTokens.findIndex((token) =>
    ['in', 'near', 'at', 'around'].includes(token)
  );
  const locationTokens = locationStart >= 0 ? lowerTokens.slice(locationStart + 1) : [];
  const conceptTokens = locationStart >= 0 ? lowerTokens.slice(0, locationStart) : lowerTokens;
  const concepts = conceptTokens.filter(
    (token) => !STOP_WORDS.has(token) && !INTENT_WORDS.has(token) && !ATTRIBUTE_WORDS.has(token)
  );

  return {
    concepts,
    locations: locationTokens.length ? [locationTokens.join(' ')] : [],
    attributes: [],
    filters,
    confidence: calculateParserConfidence({
      input,
      concepts,
      locations: [],
      attributes: []
    })
  };
}

/**
 * Fuzzy parser.
 *
 * Not enabled yet.
 *
 * For V1 we deliberately fall back to
 * deterministic rule parsing.
 */
export async function parseWithFuzzyMatching(input: ParseSearchQueryInput): Promise<ParserResult> {
  return parseWithRules(input);
}

/**
 * LLM parser.
 *
 * Not enabled yet.
 *
 * For V1 we deliberately fall back to
 * deterministic rule parsing.
 */
export async function parseWithLlm(input: ParseSearchQueryInput): Promise<ParserResult> {
  return parseWithRules(input);
}

/**
 * Select parser tier.
 *
 * V1 always uses rules.
 *
 * Later this can decide:
 *
 * rules
 *   ↓
 * fuzzy
 *   ↓
 * llm
 */
export function selectParserTier(input: ParseSearchQueryInput): ParserTier {
  if (!input.query.trim()) {
    return 'rules';
  }

  return 'rules';
}

/**
 * Calculate parser confidence.
 */
export function calculateParserConfidence(input: {
  input: ParseSearchQueryInput;
  concepts: string[];
  locations: string[];
  attributes: string[];
}): number {
  const { input: searchInput, concepts, locations, attributes } = input;

  if (!searchInput.query.trim()) {
    return 0;
  }

  let confidence = 0.4;

  if (concepts.length > 0) {
    confidence += 0.2;
  }

  if (locations.length > 0) {
    confidence += 0.2;
  }

  if (attributes.length > 0) {
    confidence += 0.1;
  }

  if (searchInput.tokens.length > 0) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1);
}

/**
 * Merge parser results.
 *
 * Useful later when rules + fuzzy + LLM
 * produce partial results.
 */
export function mergeParserResults(results: ParserResult[]): ParserResult {
  if (results.length === 0) {
    return {
      concepts: [],
      locations: [],
      attributes: [],
      filters: {},
      confidence: 0
    };
  }

  const concepts = unique(results.flatMap((result) => result.concepts));

  const locations = unique(results.flatMap((result) => result.locations));

  const attributes = unique(results.flatMap((result) => result.attributes));

  const filters: ParsedSearchQuery['filters'] = {};

  for (const result of results) {
    if (result.filters.best) {
      filters.best = true;
    }

    if (result.filters.openNow) {
      filters.openNow = true;
    }
  }

  const confidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;

  return {
    concepts,
    locations,
    attributes,
    filters,
    confidence
  };
}

/**
 * Validate parser output.
 */
export function validateParsedQuery(input: ParsedSearchQuery): void {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid parsed search query');
  }

  if (typeof input.originalQuery !== 'string') {
    throw new Error('Invalid original query');
  }

  if (!Array.isArray(input.concepts)) {
    throw new Error('Invalid concepts');
  }

  if (!Array.isArray(input.locations)) {
    throw new Error('Invalid locations');
  }

  if (!Array.isArray(input.attributes)) {
    throw new Error('Invalid attributes');
  }

  if (!Array.isArray(input.remainingTokens)) {
    throw new Error('Invalid remaining tokens');
  }

  if (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1) {
    throw new Error('Invalid parser confidence');
  }
}

/**
 * Tokens that are not parser keywords.
 */
function getRemainingTokens(tokens: string[]): string[] {
  return tokens.filter((token) => {
    const normalized = token.toLocaleLowerCase('en-IN');

    return (
      !STOP_WORDS.has(normalized) &&
      !INTENT_WORDS.has(normalized) &&
      !ATTRIBUTE_WORDS.has(normalized)
    );
  });
}

/**
 * Remove duplicates while preserving order.
 */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}
