import { paths } from '@/lib/path';
import { AddToCartRequest, CartType, UpdateCartRequest } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartType> => {
    const res = await fetch(paths.cart.base);
    if (!res.ok) throw new Error('Failed to fetch cart');
    const { data } = await res.json();
    return data;
  },

  addToCart: async (data: AddToCartRequest) => {
    const res = await fetch(paths.cart.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    const { data: responseData } = await res.json();
    return responseData;
  },

  updateCart: async (items: UpdateCartRequest['items']) => {
    const res = await fetch(paths.cart.base, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to update cart');
    const { data } = await res.json();
    return data;
  },

  removeItem: async (variantId: string) => {
    const res = await fetch(paths.cart.remove_item(variantId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId }),
    });
    if (!res.ok) throw new Error('Failed to remove item');
    const { data } = await res.json();
    return data;
  },

  clearCart: async () => {
    const res = await fetch(paths.cart.base, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear cart');
    const { data } = await res.json();
    return data;
  },
};
