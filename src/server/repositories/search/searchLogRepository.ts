export async function createSearchLog(data: unknown) {
  throw new Error("Not implemented");
}

export async function findSearchLogById(id: bigint) {
  throw new Error("Not implemented");
}

export async function updateSearchLogResultCount(
  id: bigint,
  resultCount: number,
) {
  throw new Error("Not implemented");
}

export async function updateSearchLogDuration(
  id: bigint,
  tookMs: number,
) {
  throw new Error("Not implemented");
}

export async function createSearchImpression(
  impression: unknown,
) {
  throw new Error("Not implemented");
}

export async function createSearchImpressions(
  impressions: unknown[],
) {
  throw new Error("Not implemented");
}

export async function findSearchImpressions(searchId: bigint) {
  throw new Error("Not implemented");
}

export async function createClickLog(data: unknown) {
  throw new Error("Not implemented");
}

export async function findClicksForSearch(searchId: bigint) {
  throw new Error("Not implemented");
}

export async function aggregateSearches() {
  throw new Error("Not implemented");
}

export async function aggregateZeroResultSearches() {
  throw new Error("Not implemented");
}

export async function aggregateSearchClicks() {
  throw new Error("Not implemented");
}

export async function aggregateBusinessCtr() {
  throw new Error("Not implemented");
}

export async function aggregateConceptSearches() {
  throw new Error("Not implemented");
}
