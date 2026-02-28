import { cartController } from '@/features/cart/server/controller/cart.route';
import { withAuth } from '@/lib/with-auth';

export const GET = withAuth(cartController.getCart);
export const POST = withAuth(cartController.addToCart);
export const PATCH = withAuth(cartController.updateCart);
export const DELETE = withAuth(cartController.clearCart);
