import { NextRequest } from 'next/server';
import { CartService } from '@/features/cart/services/cart.service';
import { AddToCartRequest, UpdateCartRequest } from '@/features/cart/types';
import { ResponseFactory } from '@/lib/api-response';
import { withAuth } from '@/lib/with-auth';

export const GET = withAuth(async (userId: string) => {
  try {
    const cart = await CartService.getCart(userId);
    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: cart })
    );
  } catch (e) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});

export const POST = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body: AddToCartRequest = await request.json();
    const cartItem = await CartService.addToCart(userId, body);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 'Item added to cart successfully',
        data: { cartItem },
      })
    );
  } catch (e) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', e);
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});

export const PATCH = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body: UpdateCartRequest = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Invalid request body',
          code: 400,
        })
      );
    }

    const result = await CartService.updateCart(userId, body);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: result })
    );
  } catch (e) {
    console.error('Lỗi khi cập nhật giỏ hàng:', e);
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});

export const DELETE = withAuth(async (userId: string) => {
  try {
    await CartService.clearCart(userId);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ message: 'cart deleted successfully' })
    );
  } catch (err) {
    console.error(err);
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
