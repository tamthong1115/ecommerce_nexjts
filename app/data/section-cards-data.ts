import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/require-admin';
import { OrderStatus } from '@/lib/generated/prisma';
import { getShopIdByUserId } from '@/app/data/shop.data';

export async function getSellerDashboardStats(userId: string) {
  await requireSeller();

  const shopId = await getShopIdByUserId(userId);

  if (!shopId) {
    return {
      todayRevenue: 0,
      revenueChange: 0,
      ordersToFulfill: 0,
      ordersChange: 0,
      lowStockItems: 0,
      stockChange: 0,
      returnRequests: 0,
      returnsChange: 0,
    };
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get yesterday's date range for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [todayRevenueData, yesterdayRevenueData] = await Promise.all([
    prisma.order.aggregate({
      where: {
        shopId,
        status: {
          in: [OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.SHIPPED],
        },
        placedAt: { gte: today, lt: tomorrow },
      },
      _sum: { grandTotal: true },
    }),
    prisma.order.aggregate({
      where: {
        shopId,
        status: {
          in: [OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.SHIPPED],
        },
        placedAt: { gte: yesterday, lt: today },
      },
      _sum: { grandTotal: true },
    }),
  ]);

  const todayRevenue = todayRevenueData._sum.grandTotal?.toNumber() || 0;
  const yesterdayRevenue =
    yesterdayRevenueData._sum.grandTotal?.toNumber() || 0;
  const revenueChange =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0
        ? 100
        : 0;

  // 2. Orders to Fulfill (PROCESSING status)
  const [todayProcessing, yesterdayProcessing] = await Promise.all([
    prisma.order.count({
      where: {
        shopId,
        status: OrderStatus.PROCESSING,
        placedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.order.count({
      where: {
        shopId,
        status: OrderStatus.PROCESSING,
        placedAt: {
          gte: yesterday,
          lt: today,
        },
      },
    }),
  ]);

  const ordersChange =
    yesterdayProcessing > 0
      ? ((todayProcessing - yesterdayProcessing) / yesterdayProcessing) * 100
      : todayProcessing > 0
        ? 100
        : 0;

  // 3. Low Stock Items (stock <= 10)
  const LOW_STOCK_THRESHOLD = 10;

  const [currentLowStock, previousLowStock] = await Promise.all([
    prisma.productVariant.count({
      where: {
        product: {
          shopId,
        },
        stock: {
          lte: LOW_STOCK_THRESHOLD,
          gt: 0,
        },
      },
    }),
    // Compare with count from 7 days ago
    prisma.productVariant.count({
      where: {
        product: {
          shopId,
        },
        stock: {
          lte: LOW_STOCK_THRESHOLD,
          gt: 0,
        },
        updatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const stockChange =
    previousLowStock > 0
      ? ((currentLowStock - previousLowStock) / previousLowStock) * 100
      : currentLowStock > 0
        ? 100
        : 0;

  // 4. Return Requests (OPEN status)
  const [currentReturns, previousReturns] = await Promise.all([
    prisma.returnRequest.count({
      where: {
        order: {
          shopId,
        },
        status: 'OPEN',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.returnRequest.count({
      where: {
        order: {
          shopId,
        },
        status: 'OPEN',
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    }),
  ]);

  const returnsChange =
    previousReturns > 0
      ? ((currentReturns - previousReturns) / previousReturns) * 100
      : currentReturns > 0
        ? 100
        : 0;

  return {
    todayRevenue,
    revenueChange: Math.round(revenueChange * 10) / 10,
    ordersToFulfill: todayProcessing,
    ordersChange: Math.round(ordersChange * 10) / 10,
    lowStockItems: currentLowStock,
    stockChange: Math.round(stockChange * 10) / 10,
    returnRequests: currentReturns,
    returnsChange: Math.round(returnsChange * 10) / 10,
  };
}
