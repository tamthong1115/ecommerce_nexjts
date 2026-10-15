import { prisma } from '@/lib/db';

export const getItemsQtyByDraftId = async (id: string) => {
  return prisma.orderDraft.findUnique({
    where: { id: id },
    select: {
      items: {
        select: {
          variantId: true,
          quantity: true,
        },
      },
    },
  });
};
