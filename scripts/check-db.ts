import { database } from '../src/server/db';
const db = database();
try {
  const [places, locations, categories] = await Promise.all([
    db.business.count(),
    db.location.count(),
    db.concept.count()
  ]);
  console.log(JSON.stringify({ connected: true, places, locations, categories }));
} catch (error) {
  console.error(
    'Database verification failed:',
    (error as { code?: string }).code || 'connection unavailable'
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
