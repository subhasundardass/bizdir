export async function retrieveByAttribute(input: unknown) {
  throw new Error("Not implemented");
}

export async function retrieveActiveBusinesses() {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesByAttribute(attributeId: bigint) {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesByAttributeOption(
  attributeId: bigint,
  optionId: bigint,
) {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesByBooleanAttribute(
  attributeId: bigint,
  value: boolean,
) {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesByNumberAttribute(
  attributeId: bigint,
  min?: number,
  max?: number,
) {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesByChoiceAttribute(
  attributeId: bigint,
  optionIds: bigint[],
) {
  throw new Error("Not implemented");
}

export async function retrieveBusinessesOpenNow(cityId?: bigint) {
  throw new Error("Not implemented");
}

export async function isBusinessOpenNow(
  businessId: bigint,
  date?: Date,
) {
  throw new Error("Not implemented");
}

export async function getBusinessHoursForDay(
  businessId: bigint,
  weekday: number,
) {
  throw new Error("Not implemented");
}

export async function getBusinessHours(businessId: bigint) {
  throw new Error("Not implemented");
}

export async function isBusinessOpenAt(
  businessId: bigint,
  date: Date,
) {
  throw new Error("Not implemented");
}

export async function isBusinessClosedToday(
  businessId: bigint,
  date?: Date,
) {
  throw new Error("Not implemented");
}

export async function isBusinessTwentyFourSeven(
  businessId: bigint,
) {
  throw new Error("Not implemented");
}

export async function isBusinessClosedForSpecialClosure(
  businessId: bigint,
  date: Date,
) {
  throw new Error("Not implemented");
}
