import { withAuth } from '@/lib/with-auth';
import { cartController } from '@/features/cart/server/controller/cart.route';

export const DELETE = withAuth(cartController.removeItem);
