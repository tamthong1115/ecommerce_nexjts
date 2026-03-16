import { prisma_clean } from '@/lib/queue/prisma-clean';

export const getItemsQtyByDraftId = async (id: string) => {
  return prisma_clean.orderDraft.findUnique({
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
