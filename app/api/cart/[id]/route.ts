import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { CartService } from '@/features/cart/services/cart.service';
import { ResponseFactory } from '@/lib/api-response';

export const DELETE = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { variantId } = body;

    if (!variantId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'variantId is required',
          code: 400,
        })
      );
    }

    await CartService.removeItem(userId, variantId);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 'Product removed from cart successfully',
      })
    );
  } catch (e) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', e);
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});
