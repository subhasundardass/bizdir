import assert from 'node:assert/strict';
import { searchService } from '../src/client-app/server/search/searchService';
import { database } from '../src/server/db';
try {
  const result = await searchService.executeSearch({ query: 'restaurants', page: 1, perPage: 5 });
  assert.equal(typeof result.total, 'number');
  assert.ok(Array.isArray(result.businesses));
  const concepts = await searchService.suggestSearch({ query: 'restaurant', type: 'concept' });
  const locations = await searchService.suggestSearch({ query: 'delhi', type: 'location' });
  assert.ok(Array.isArray(concepts));
  assert.ok(Array.isArray(locations));
  console.log('PASS: public search and suggestions use the shared application database.');
} finally {
  await database().$disconnect();
}
