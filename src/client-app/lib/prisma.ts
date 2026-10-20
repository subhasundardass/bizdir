import { database, Prisma } from '@/server/db';
export const prisma = database();
export const Decimal = Prisma.Decimal;
