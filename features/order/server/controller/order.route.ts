import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/require-role';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import { $Enums, Prisma } from '@/lib/generated/prisma';
import OrderStatus = $Enums.OrderStatus;
import QueryMode = Prisma.QueryMode;
import { GetOrderStatsSchema } from '@/features/order/order.dto';
import { getOrderStats } from '@/features/order/server/order.service';

export async function getOrdersRoute(req: NextRequest) {
  try {
    const sellerSession = await requireSeller();

    if (!sellerSession) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const { searchParams } = new URL(req.url);

    // FIX: Dynamic Limit based on client request (default to 12 if missing)
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam)) : 12;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const skip = (page - 1) * limit;

    // sort params
    const status = searchParams.get('status');
    const timeRange = searchParams.get('timeRange');
    const dateParam = searchParams.get('date');
    const targetShopId = searchParams.get('shopId');
    const orderNumber = searchParams.get('search');

    const shops = await prisma.shop.findMany({
      where: { ownerId: sellerSession.user.id },
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
      // Default to today/all time depending on logic preference, keeping existing:
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
        orderBy: {
          placedAt: 'desc',
        },
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

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: orders,
        total,
        page,
        limit,
        message: 'Fetch successful',
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function getOrderStatsRoute(req: Request) {
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Unauthorized', code: 401 })
      );
    }

    const { searchParams } = new URL(req.url);

    const rawInput = {
      shopId: searchParams.get('shopId') || 'all',
      days: searchParams.get('days'),
    };

    const validation = GetOrderStatsSchema.safeParse(rawInput);

    if (!validation.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Invalid parameters',
          code: 400,
          errors: validation.error.flatten().fieldErrors,
        })
      );
    }

    const stats = await getOrderStats(session.user.id, validation.data);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: stats })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
}

export async function updateOrderStatusRoute(req: NextRequest) {
  try {
    const sellerSession = await requireSeller();
    if (!sellerSession) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'orderId or status missing',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    // Verify ownership before update
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        shop: { ownerId: sellerSession.user.id },
      },
    });

    if (!existingOrder) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Order not found or access denied',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: order,
        message: 'Update success',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
