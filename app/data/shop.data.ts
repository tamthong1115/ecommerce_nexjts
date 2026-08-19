import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/require-admin';

export async function getShopIdByUserId(
  userId: string
): Promise<string | undefined> {
  await requireSeller();

  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });

  return shop?.id ?? undefined;
}

export async function getShopMembers(shopId: string) {
  await requireSeller();

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      members: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return shop;
}
