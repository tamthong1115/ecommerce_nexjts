import { Prisma } from '@/lib/generated/prisma';

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    vouchers: { include: { voucher: true } };
    applications: { include: { promotion: true } };
  };
}>;
