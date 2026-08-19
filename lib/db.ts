import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { auditAndSoftDeleteExtension } from './prisma-extension';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

function createExtenedClient() {
  const basePrisma = new PrismaClient({ adapter });
  return basePrisma.$extends(auditAndSoftDeleteExtension) as unknown as PrismaClient;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createExtenedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
