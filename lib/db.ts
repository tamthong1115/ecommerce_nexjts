import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { auditAndSoftDeleteExtension } from './prisma-extension';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

const pool =
  globalForPrisma.pgPool ||
  new pg.Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

function createExtendedClient() {
  const basePrisma = new PrismaClient({ adapter });
  return basePrisma.$extends(auditAndSoftDeleteExtension) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma || createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
