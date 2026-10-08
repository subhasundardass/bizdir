export async function logSearch(input: unknown) {
  throw new Error("Not implemented");
}

export async function createSearchLog(input: unknown) {
  throw new Error("Not implemented");
}

export async function updateSearchLog(input: unknown) {
  throw new Error("Not implemented");
}

export function normalizeLoggedQuery(input: unknown) {
  throw new Error("Not implemented");
}

export function serializeParsedQuery(input: unknown) {
  throw new Error("Not implemented");
}

export function calculateSearchDuration(
  startedAt: number,
) {
  throw new Error("Not implemented");
}

export async function recordSearchResultCount(
  searchId: bigint,
  resultCount: number,
) {
  throw new Error("Not implemented");
}

export async function recordParserTier(
  searchId: bigint,
  parserTier: string,
) {
  throw new Error("Not implemented");
}

export async function recordSearchLocation(
  searchId: bigint,
  cityId?: bigint,
) {
  throw new Error("Not implemented");
}
