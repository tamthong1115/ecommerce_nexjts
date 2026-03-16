import 'server-only';
// // --- CHÈN ĐOẠN NÀY VÀO ĐẦU FILE ---
// try {
//   if (module && module.parent) {
//     console.log('\n\n==================================================');
//     console.log('🚨 BẮT QUẢ TANG! File này đang import lib/db:');
//     console.log('👉 ' + module.parent.filename);
//     console.log('==================================================\n\n');
//   }
// } catch (e) {
//   // Phòng trường hợp môi trường không hỗ trợ module.parent
//   console.trace('Trace dự phòng');
// }
// // -------------------------------------
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
