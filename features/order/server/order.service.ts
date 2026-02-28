import { prisma } from '@/lib/db';
import { GetOrderStatsInput, OrderStatsResult } from '../order.dto';
import { getCurrentUserId } from '@/lib/auth';
import { $Enums } from '@/lib/generated/prisma';
import PaymentStatus = $Enums.PaymentStatus;

export const getOrderStats = async (
  userId: string,
  params: GetOrderStatsInput
): Promise<OrderStatsResult[]> => {
  const { shopId, days } = params;
  let targetShopIds: string[] = [];

  if (shopId && shopId !== 'all') {
    targetShopIds = [shopId];
  } else {
    const myShops = await prisma.shop.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });
    targetShopIds = Array.from(new Set(myShops.map((s) => s.id)));
  }

  if (targetShopIds.length === 0) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days || 90));

  const orders = await prisma.order.findMany({
    where: {
      shopId: { in: targetShopIds },
      placedAt: { gte: startDate },
    },
    select: {
      id: true,
      placedAt: true,
      grandTotal: true,
    },
    orderBy: { placedAt: 'asc' },
  });

  const ordersByDate = orders.reduce(
    (acc, order) => {
      const date = order.placedAt.toISOString().split('T')[0];

      if (!acc[date]) {
        acc[date] = { date, totalOrders: 0, revenue: 0 };
      }

      acc[date].totalOrders += 1;
      acc[date].revenue += Number(order.grandTotal) || 0;

      return acc;
    },
    {} as Record<string, OrderStatsResult>
  );

  return Object.values(ordersByDate);
};

export const getOrdersCanPay = async (orderIds: string[]) => {
  const userId = await getCurrentUserId();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (!userId) throw new Error('Unauthorized');
  return prisma.order.findMany({
    where: {
      id: { in: orderIds },
      userId: userId,
      paymentStatus: PaymentStatus.PENDING,
      status: { notIn: ['CANCELED', 'REFUNDED', 'EXPIRED'] },
      placedAt: { gte: oneDayAgo },
    },
  });
};
