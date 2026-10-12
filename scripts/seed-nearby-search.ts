import { db } from "../src/lib/db";

// The point shared by the user: Kharian, Pakistan. Businesses below are fictional.
const origin = { lat: 32.7875673, lng: 73.8889499 };
const fixtures = [
  {
    slug: "test-nearby-kharian-plumber-1",
    name: "TEST Kharian Plumber Nearby",
    lat: origin.lat + 0.002,
    lng: origin.lng,
    city: "kharian",
    concept: "plumber",
    rating: 3.0,
  },
  {
    slug: "test-nearby-kharian-plumber-2",
    name: "TEST Kharian Plumber Market",
    lat: origin.lat + 0.01,
    lng: origin.lng,
    city: "kharian",
    concept: "plumber",
    rating: 3.5,
  },
  {
    slug: "test-nearby-kharian-plumber-3",
    name: "TEST Kharian Plumber Outer Area",
    lat: origin.lat + 0.03,
    lng: origin.lng,
    city: "kharian",
    concept: "plumber",
    rating: 4.0,
  },
  {
    slug: "test-nearby-kharian-plumber-4",
    name: "TEST Kharian Plumber Distant",
    lat: origin.lat - 0.07,
    lng: origin.lng + 0.02,
    city: "kharian",
    concept: "plumber",
    rating: 4.5,
  },
  {
    slug: "test-nearby-lalamusa-plumber",
    name: "TEST Lalamusa Plumber",
    lat: 32.701,
    lng: 73.957,
    city: "lalamusa",
    concept: "plumber",
    rating: 4.8,
  },
  {
    slug: "test-nearby-gujrat-plumber",
    name: "TEST Gujrat City Plumber",
    lat: 32.574,
    lng: 74.078,
    city: "gujrat",
    concept: "plumber",
    rating: 5.0,
  },
  {
    slug: "test-nearby-kharian-electrician",
    name: "TEST Kharian Electrician",
    lat: origin.lat + 0.004,
    lng: origin.lng + 0.004,
    city: "kharian",
    concept: "electrician",
    rating: 4.0,
  },
  {
    slug: "test-nearby-kharian-ac-repair",
    name: "TEST Kharian AC Repair",
    lat: origin.lat - 0.012,
    lng: origin.lng + 0.006,
    city: "kharian",
    concept: "ac_repair",
    rating: 4.0,
  },
];

try {
  await db.$transaction(async (tx) => {
    const location = async (
      name: string,
      slug: string,
      level: string,
      parentId: number | null,
    ) => {
      const existing = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM location WHERE slug=${slug} AND parent_id IS NOT DISTINCT FROM ${parentId}::int LIMIT 1`;
      if (existing[0]) return existing[0].id;
      const inserted = await tx.$queryRaw<Array<{ id: number }>>`
        INSERT INTO location (name,slug,level,parent_id,is_active)
        VALUES (${name},${slug},${level},${parentId},TRUE) RETURNING id`;
      return inserted[0].id;
    };
    const state = await location(
      "Punjab, Pakistan",
      "punjab-pakistan",
      "state",
      null,
    );
    const district = await location(
      "Gujrat District",
      "gujrat-district",
      "district",
      state,
    );
    const cityIds: Record<string, number> = {};
    for (const [name, slug] of [
      ["Kharian", "kharian"],
      ["Lalamusa", "lalamusa"],
      ["Gujrat", "gujrat"],
    ]) {
      cityIds[slug] = await location(name, slug, "city", district);
    }
    for (const text of ["gujrat", "gujrat pakistan", "gujrat district"]) {
      await tx.$executeRaw`INSERT INTO location_alias (location_id,text) VALUES (${district},${text}) ON CONFLICT DO NOTHING`;
    }
    for (const fixture of fixtures) {
      const concepts = await tx.$queryRaw<
        Array<{ id: number }>
      >`SELECT id FROM concept WHERE slug=${fixture.concept} AND is_active=TRUE`;
      if (!concepts[0]) throw new Error(`Missing concept ${fixture.concept}`);
      const existing = await tx.$queryRaw<
        Array<{ id: bigint; source: string }>
      >`SELECT id,source FROM business WHERE slug=${fixture.slug}`;
      if (existing[0] && existing[0].source !== "demo")
        throw new Error(`Non-demo slug collision: ${fixture.slug}`);
      const businesses = await tx.$queryRaw<Array<{ id: bigint }>>`
        INSERT INTO business (slug,name,address,city_id,geom,phone,description,status,source,rating,review_count)
        VALUES (${fixture.slug},${fixture.name},${`Fictional test listing in ${fixture.city}, Gujrat District, Pakistan`},
          ${cityIds[fixture.city]},ST_SetSRID(ST_MakePoint(${fixture.lng},${fixture.lat}),4326)::geography,
          '+919999999999', 'Fictional listing for testing nearest-first search. Not a real business.', 'active','demo',${fixture.rating},0)
        ON CONFLICT (slug) DO UPDATE SET geom=EXCLUDED.geom,name=EXCLUDED.name,rating=EXCLUDED.rating
        RETURNING id`;
      await tx.$executeRaw`INSERT INTO business_concept (business_id,concept_id,is_primary)
        VALUES (${businesses[0].id},${concepts[0].id},TRUE) ON CONFLICT DO NOTHING`;
    }
  });
  console.log(
    `Seeded ${fixtures.length} fictional demo businesses around the shared Kharian point.`,
  );
  console.log(
    "Try: Plumber + Gujrat, or Gujrat alone. Allow browser location for nearest-first ordering.",
  );
} finally {
  await db.$disconnect();
}
