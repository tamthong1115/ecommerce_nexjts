import { ResponseFactory } from '@/lib/api-response';
import { requireSeller } from '@/lib/require-admin';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import { updateSellerOrderStatus } from '@/features/order/services/order.service';

export async function PUT(req: NextRequest) {
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

    const order = await updateSellerOrderStatus(
      sellerSession.user.id,
      orderId,
      status
    );

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
