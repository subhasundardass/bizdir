import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@/generated/prisma/client';
for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) loadEnvFile(file);
}

const globalDb = globalThis as unknown as { bizdirDb?: PrismaClient };
export function database() {
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL is missing. Configure DATABASE_URL in .env.local.');
  return (globalDb.bizdirDb ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
  }));
}
export { Prisma };
