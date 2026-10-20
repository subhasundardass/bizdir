export function tokenizeSearchQuery(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  return text.trim().split(/\s+/).filter(Boolean);
}

export function tokenizeQuery(text: string) {
  throw new Error('Not implemented');
}

export function classifyQueryTokens(tokens: string[]) {
  throw new Error('Not implemented');
}

export function removeStopWords(tokens: string[]) {
  throw new Error('Not implemented');
}

export function identifySearchPhrases(tokens: string[]) {
  throw new Error('Not implemented');
}

export function generateTokenNgrams(tokens: string[], maxN?: number) {
  throw new Error('Not implemented');
}
