import { ResponseFactory } from '@/lib/api-response';
import { requireSeller } from '@/lib/require-admin';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import { getSellerOrders } from '@/features/order/services/order.service';

export async function GET(req: NextRequest) {
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

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam)) : 12;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    const result = await getSellerOrders({
      sellerId: sellerSession.user.id,
      limit,
      page,
      status: searchParams.get('status'),
      timeRange: searchParams.get('timeRange'),
      dateParam: searchParams.get('date'),
      targetShopId: searchParams.get('shopId'),
      orderNumber: searchParams.get('search'),
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: result.orders,
        total: result.total,
        page: result.page,
        limit: result.limit,
        message: 'Fetch successful',
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
