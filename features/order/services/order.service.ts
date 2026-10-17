import { prisma } from '@/lib/db';
import { GetOrderStatsInput, OrderStatsResult } from '../types/order.dto';
import { getCurrentUserId } from '@/lib/auth';
import { $Enums, Prisma } from '@/lib/generated/prisma';
import { releaseRedemptions } from '@/features/promotion/services/redemption.service';
import PaymentStatus = $Enums.PaymentStatus;
import OrderStatus = $Enums.OrderStatus;
import QueryMode = Prisma.QueryMode;

export interface GetSellerOrdersParams {
  sellerId: string;
  limit?: number;
  page?: number;
  status?: string | null;
  timeRange?: string | null;
  dateParam?: string | null;
  targetShopId?: string | null;
  orderNumber?: string | null;
}

export const getSellerOrders = async (params: GetSellerOrdersParams) => {
  const {
    sellerId,
    limit = 12,
    page = 1,
    status,
    timeRange,
    dateParam,
    targetShopId,
    orderNumber,
  } = params;

  const skip = (Math.max(1, page) - 1) * limit;

  const shops = await prisma.shop.findMany({
    where: { ownerId: sellerId },
    select: { id: true },
  });
  const shopIds = shops.map((s) => s.id);

  let filterShopIds = shopIds;
  if (targetShopId && shopIds.includes(targetShopId)) {
    filterShopIds = [targetShopId];
  }

  let dateFilter: any = {};
  const now = new Date();

  if (dateParam) {
    const targetDate = new Date(dateParam);
    if (!isNaN(targetDate.getTime())) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
  } else if (timeRange === 'week') {
    const start = new Date(now.setDate(now.getDate() - 7));
    dateFilter = { gte: start };
  } else if (timeRange === 'month') {
    const start = new Date(now.setDate(now.getDate() - 30));
    dateFilter = { gte: start };
  } else {
    const start = new Date(now.setHours(0, 0, 0, 0));
    dateFilter = { gte: start };
  }

  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const whereClause: Prisma.OrderWhereInput = {
    shopId: { in: filterShopIds },
    ...(status ? { status: status as OrderStatus } : {}),
    ...(hasDateFilter ? { placedAt: dateFilter } : {}),
    ...(orderNumber
      ? {
          orderNumber: {
            contains: orderNumber,
            mode: 'insensitive' as QueryMode,
          },
        }
      : {}),
  };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { placedAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
            variant: {
              select: { image: true },
            },
          },
        },
        shop: {
          select: { name: true },
        },
      },
    }),
  ]);

  return { orders, total, page, limit };
};

export const updateSellerOrderStatus = async (
  sellerId: string,
  orderId: string,
  newStatus: OrderStatus
) => {
  // 1. Verify seller ownership
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      shop: { ownerId: sellerId },
    },
  });

  if (!existingOrder) {
    throw new Error('Order not found or access denied');
  }

  // 2. Update status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  if (newStatus === OrderStatus.CANCELED) {
    await releaseRedemptions(prisma, { orderId });
  }

  return updatedOrder;
};

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
