export async function retrieveSearchCandidates(input: unknown) {
  throw new Error("Not implemented");
}

export async function retrieveByConcept(conceptId: bigint) {
  throw new Error("Not implemented");
}

export async function retrieveByConceptHierarchy(conceptIds: bigint[]) {
  throw new Error("Not implemented");
}

export async function retrieveByLocation(locationId: bigint) {
  throw new Error("Not implemented");
}

export async function retrieveByLocality(localityId: bigint) {
  throw new Error("Not implemented");
}

export async function retrieveByCity(cityId: bigint) {
  throw new Error("Not implemented");
}

export async function retrieveNearbyCities(input: unknown) {
  throw new Error("Not implemented");
}

export async function retrieveByDistance(input: unknown) {
  throw new Error("Not implemented");
}

export async function retrieveWithinRadius(
  lat: number,
  lng: number,
  radiusMeters: number,
) {
  throw new Error("Not implemented");
}

export async function expandSearchRadius(input: unknown) {
  throw new Error("Not implemented");
}

export async function shouldExpandLocationSearch(input: unknown) {
  throw new Error("Not implemented");
}

export function hasEnoughCandidates(candidates: unknown[]) {
  throw new Error("Not implemented");
}
