import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../client/cart.api';
import { toast } from 'sonner';

export const CART_KEYS = {
  all: ['cart'] as const,
  details: () => [...CART_KEYS.all, 'details'] as const,
};

export function useCart() {
  return useQuery({
    queryKey: CART_KEYS.details(),
    queryFn: cartApi.getCart,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      toast.success('Added to cart successfully');
    },
    onError: (error) => {
      toast.error('Failed to add to cart');
      console.error(error);
    },
  });
}

export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.updateCart,
    onMutate: async (items) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CART_KEYS.details() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(CART_KEYS.details());

      // Optimistically update to the new value
      queryClient.setQueryData(CART_KEYS.details(), (old: any) => {
        if (!old) return old;
        return {
            ...old,
            items: old.items.map((item: any) => {
                const update = items.find(u => u.variant.id === item.variant.id);
                if (update) {
                    return { ...item, quantity: update.quantity };
                }
                return item;
            })
        };
      });

      return { previousCart };
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(CART_KEYS.details(), context.previousCart);
      toast.error('Failed to update cart');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
}


export function useRemoveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.removeItem,
    onMutate: async (variantId) => {
        await queryClient.cancelQueries({ queryKey: CART_KEYS.details() });
        const previousCart = queryClient.getQueryData(CART_KEYS.details());
        
        queryClient.setQueryData(CART_KEYS.details(), (old: any) => {
            if (!old) return old;
            return {
                ...old,
                items: old.items.filter((item: any) => item.variant.id !== variantId)
            };
        });
        
        return { previousCart };
    },
    onSuccess: () => {
      toast.success('Item removed');
    },
    onError: (err, variables, context: any) => {
        queryClient.setQueryData(CART_KEYS.details(), context.previousCart);
        toast.error('Failed to remove item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(CART_KEYS.details(), (old: any) => ({ ...old, items: [] }));
      toast.success('Cart cleared');
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    }
  });
}
