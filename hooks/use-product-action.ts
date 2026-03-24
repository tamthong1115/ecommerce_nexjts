'use client';

import { createOrderDraft } from '@/app/actions/order_draft';
import { authClient } from '@/lib/auth-client';
import { paths } from '@/lib/path';
import { AddToCartRequest } from '@/types/cart.data-types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ItemType = {
  productId: string;
  variantId: string;
  quantity: number;
};

interface UseProductActionsOptions {
  pathname: string;
  //* callback sau khi add to cart thành công */
  onAddToCartSuccess?: () => void;
}

export function useProductActions({
  pathname,
  onAddToCartSuccess,
}: UseProductActionsOptions) {
  const router = useRouter();

  const requireAuth = async (): Promise<boolean> => {
    const session = await authClient.getSession();
    if (!session?.data?.user?.emailVerified) {
      const callback = encodeURIComponent(pathname ?? '/');
      router.push(`${paths.login}?callbackUrl=${callback}`);
      return false;
    }
    return true;
  };

  const addToCart = async (params: AddToCartRequest) => {
    if (!(await requireAuth())) return;

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        toast.success('Thêm vào giỏ hàng thành công');
        onAddToCartSuccess?.();
      } else {
        const err = await res.json().catch(() => res.statusText);
        const msg = res.status === 401 ? 'Bạn chưa đăng nhập' : err;
        toast.error(`Thêm vào giỏ hàng thất bại: ${msg}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(`Thêm vào giỏ hàng thất bại: ${msg}`);
    }
  };

  const buyNow = async (item: ItemType, voucherCodes: { code: string }[]) => {
    if (!(await requireAuth())) return;

    try {
      const formData = new FormData();
      formData.append(
        'data',
        JSON.stringify({ notes: '', items: [item], voucher: voucherCodes })
      );

      const res = await createOrderDraft(formData);

      if (res.success) {
        toast.success('Đang chuyển đến trang thanh toán...');
        router.push('/checkout');
      } else if (!res.success && res?.redirectTo) {
        toast.error(res.message);
        router.push(res.redirectTo);
      } else {
        toast.error('Lỗi: ' + res.error);
      }
    } catch (e) {
      toast.error(`Lỗi: ${e}`);
    }
  };

  return { addToCart, buyNow };
}
