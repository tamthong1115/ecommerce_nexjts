import { NextRequest } from 'next/server';
import { CartService } from '../cart.service';
import { AddToCartRequest, UpdateCartRequest } from '@/features/cart/types';
import { ResponseFactory } from '@/lib/api-response';

class CartController {
  public getCart = async (userId: string) => {
    try {
      const cart = await CartService.getCart(userId);
      return ResponseFactory.toNextResponse(
        ResponseFactory.success({ data: cart })
      );
    } catch (e) {
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
    }
  };

  public addToCart = async (userId: string, request: NextRequest) => {
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
  };

  public updateCart = async (userId: string, request: NextRequest) => {
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
  };

  public clearCart = async (userId: string) => {
    try {
      await CartService.clearCart(userId);

      return ResponseFactory.toNextResponse(
        ResponseFactory.success({ message: 'cart deleted successfully' })
      );
    } catch (err) {
      console.error(err);
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
    }
  };

  public removeItem = async (userId: string, request: NextRequest) => {
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
  };
}

export const cartController = new CartController();
