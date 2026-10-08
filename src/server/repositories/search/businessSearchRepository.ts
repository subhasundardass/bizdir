export async function findBusinessById(id: bigint) {
  throw new Error("Not implemented");
}

export async function findBusinessBySlug(slug: string) {
  throw new Error("Not implemented");
}

export async function findBusinessByPhone(phone: string) {
  throw new Error("Not implemented");
}

export async function findBusinessBySourceRef(
  source: string,
  sourceRef: string,
) {
  throw new Error("Not implemented");
}

export async function searchBusinessesByName(query: string) {
  throw new Error("Not implemented");
}

export async function searchBusinessesByNameFuzzy(query: string) {
  throw new Error("Not implemented");
}

export async function findBusinessesByConcept(conceptId: bigint) {
  throw new Error("Not implemented");
}

export async function findBusinessesByConceptTree(
  conceptIds: bigint[],
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByLocation(locationId: bigint) {
  throw new Error("Not implemented");
}

export async function findBusinessesByLocality(localityId: bigint) {
  throw new Error("Not implemented");
}

export async function findBusinessesByCity(cityId: bigint) {
  throw new Error("Not implemented");
}

export async function findBusinessesWithinRadius(
  lat: number,
  lng: number,
  radiusMeters: number,
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByAttribute(
  attributeId: bigint,
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByAttributeOption(
  attributeId: bigint,
  optionId: bigint,
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByBooleanAttribute(
  attributeId: bigint,
  value: boolean,
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByNumberAttribute(
  attributeId: bigint,
  min?: number,
  max?: number,
) {
  throw new Error("Not implemented");
}

export async function findBusinessesByChoiceAttribute(
  attributeId: bigint,
  optionIds: bigint[],
) {
  throw new Error("Not implemented");
}

export async function findBusinessesOpenNow(cityId?: bigint) {
  throw new Error("Not implemented");
}

export async function findActiveBusinesses() {
  throw new Error("Not implemented");
}
