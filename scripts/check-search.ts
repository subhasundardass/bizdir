import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { searchService } from "../src/server/search/searchService";
import { locationResolver } from "../src/server/search/resolver/locationResolver";

try {
  const samples = await db.$queryRaw<
    Array<{
      name: string;
      city: string;
      cityId: number;
      locality: string | null;
      localityId: number | null;
    }>
  >`
    SELECT c.name, l.name AS city, l.id AS "cityId", loc.name AS locality, loc.id AS "localityId"
    FROM business b JOIN business_concept bc ON bc.business_id=b.id
    JOIN concept c ON c.id=bc.concept_id JOIN location l ON l.id=b.city_id
    LEFT JOIN location loc ON loc.id=b.locality_id
    WHERE b.status='active' AND c.is_active=TRUE AND l.is_active=TRUE
    ORDER BY b.id LIMIT 10
  `;
  assert(
    samples.length,
    "Need active businesses with concepts to verify search",
  );
  const sample = samples[0];
  const selected = await searchService.executeSearch({
    query: sample.name,
    locationId: sample.cityId,
    location: sample.city,
  });
  assert(selected.total > 0);
  assert(selected.businesses.every((row) => row.cityId === sample.cityId));
  const resolved = await searchService.createSearchContext({
    query: sample.name,
  });
  const { conceptResolver } =
    await import("../src/server/search/resolver/conceptResolver");
  const matches = await conceptResolver.resolve({
    query: resolved.normalizedQuery,
    tokens: resolved.tokens,
    parsed: resolved.parsed,
  });
  const exact = matches.find((match) => match.name === sample.name);
  assert(exact);
  const expected = await db.$queryRaw<Array<{ id: bigint }>>`
    WITH RECURSIVE tree AS (
      SELECT id FROM concept WHERE id=${exact.id}
      UNION SELECT c.id FROM concept c JOIN tree t ON c.parent_id=t.id WHERE c.is_active=TRUE
    )
    SELECT b.id FROM business b JOIN business_concept bc ON bc.business_id=b.id
    WHERE bc.concept_id IN (SELECT id FROM tree) AND b.city_id=${sample.cityId} AND b.status='active'
  `;
  assert.deepEqual(
    new Set(selected.businesses.map((row) => row.id)),
    new Set(expected.map((row) => Number(row.id))),
  );
  const named = await db.$queryRaw<
    Array<{ name: string }>
  >`SELECT name FROM business WHERE status='active' AND city_id=${sample.cityId} LIMIT 1`;
  const nameSearch = await searchService.executeSearch({
    query: named[0].name,
    locationId: sample.cityId,
  });
  assert(nameSearch.businesses.some((row) => row.name === named[0].name));
  const manual = await searchService.executeSearch({
    query: sample.name,
    location: sample.city,
  });
  assert.equal(manual.total, selected.total);
  const combined = await searchService.executeSearch({
    query: `${sample.name} in ${sample.city}`,
  });
  assert.equal(combined.total, selected.total);
  const invalid = await searchService.executeSearch({
    query: sample.name,
    location: "zzzzunfindablelocationqqqq",
  });
  assert(invalid.locationUnresolved);
  assert.equal(invalid.total, 0);
  const invalidId = await searchService.executeSearch({
    query: sample.name,
    locationId: 2147483647,
  });
  assert(invalidId.locationUnresolved);
  assert.equal(invalidId.total, 0);
  const suggestions = await searchService.suggestSearch({
    query: sample.city,
    type: "location",
  });
  assert(suggestions.some((row) => row.id === sample.cityId));
  const concepts = await searchService.suggestSearch({
    query: sample.name,
    type: "concept",
  });
  assert(concepts.length > 0);
  const first = await searchService.executeSearch({
    query: sample.name,
    locationId: sample.cityId,
    perPage: 1,
  });
  assert.equal(first.total, selected.total);
  assert.equal(first.businesses.length, 1);
  if (first.total > 1) {
    const second = await searchService.executeSearch({
      query: sample.name,
      locationId: sample.cityId,
      perPage: 1,
      page: 2,
    });
    assert.notEqual(first.businesses[0].id, second.businesses[0].id);
  }
  if (sample.locality && sample.localityId) {
    const scoped = await locationResolver.resolve({
      text: `${sample.locality}, ${sample.city}`,
    });
    assert.equal(Number(scoped?.id), sample.localityId);
    const local = await searchService.executeSearch({
      query: sample.name,
      locationId: sample.localityId,
    });
    assert(local.total > 0);
    assert(
      local.businesses.every((row) => row.localityId === sample.localityId),
    );
  }
  await assert.rejects(() => searchService.executeSearch({ query: "a" }));
  await assert.rejects(() =>
    searchService.executeSearch({ query: sample.name, locationId: -1 }),
  );
  console.log(
    "PASS: concept suggestions, location suggestions, selected/manual/inline locations, unknown locations, pagination, validation, locality scope",
  );
  console.log(
    `Verified ${sample.name} in ${sample.city}: ${selected.total} matching businesses`,
  );
} finally {
  await db.$disconnect();
}
