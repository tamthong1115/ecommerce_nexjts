'use client';

import { createOrderDraft, getOrderDrafts } from '@/app/actions/order_draft';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/debounce';
import { env } from '@/lib/env';
import { CartType } from '@/types/cart.data-types';
import { TicketIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CiShoppingBasket } from 'react-icons/ci';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { getTwoRandomVoucherCodes } from '@/features/voucher/voucher-helper';

const emptyCart: CartType = {
  id: '',
  userId: '',
  items: [],
};

type itemType = {
  productId: string;
  variantId: string;
  quantity: number;
};

export default function Cart() {
  const router = useRouter();
  const t = useTranslations('cart_page');
  const c = useTranslations('general');
  const [cart, setCart] = useState<CartType>(emptyCart);
  const [loading, setLoading] = useState(true);
  let noItems = false;
  const [selectedItem, setSelectedItem] = useState<itemType[]>([]);
  const allSelected =
    cart.items.length > 0 &&
    cart.items.every((item) =>
      selectedItem.some((obj) => obj.variantId === item.variant.id)
    );

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/cart`);
        if (!res.ok) throw new Error('Failed to fetch cart');
        const data = await res.json();
        setCart(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const [pendingUpdates, setPendingUpdates] = useState<Record<string, number>>(
    {}
  );

  const updateLocalQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) =>
        item.variant.id === variantId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }));

    setPendingUpdates((prev) => ({
      ...prev,
      [variantId]: newQuantity,
    }));
  };

  const updatesRef = useRef(pendingUpdates);
  useEffect(() => {
    updatesRef.current = pendingUpdates;
  }, [pendingUpdates]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(updatesRef.current).length > 0) {
        navigator.sendBeacon(
          '/api/cart/update',
          JSON.stringify({ items: updatesRef.current })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const debouncedUpdates = useDebounce(pendingUpdates, 1000);

  useEffect(() => {
    if (Object.keys(debouncedUpdates).length === 0) return;

    const formattedItems = Object.entries(debouncedUpdates).map(
      ([variantId, quantity]) => ({
        variant: { id: variantId },
        quantity,
      })
    );

    fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: formattedItems }),
    })
      .then(() => setPendingUpdates({}))
      .catch(console.error);
  }, [debouncedUpdates]);

  const removeItem = async (variantId: string) => {
    if (!confirm(t('t_remove_item_confirm'))) return;

    try {
      const res = await fetch(`/api/cart/${variantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      if (res.ok) {
        setCart((prev: any) => ({
          ...prev,
          items: prev.items.filter(
            (item: any) => item.variant.id !== variantId
          ),
        }));
        setPendingUpdates((prev) => {
          const newUpdates = { ...prev };
          delete newUpdates[variantId];
          return newUpdates;
        });
      } else {
        alert(t('t_remove_item_failed'));
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      alert(t('t_failed'));
    }
  };

  const clearCart = async () => {
    if (!confirm(t('t_remove_all'))) return;

    try {
      const res = await fetch('/api/cart', { method: 'DELETE' });
      if (res.ok) {
        setCart((prev: any) => ({ ...prev, items: [] }));
        setPendingUpdates({});
      } else {
        alert(t('t_remove_all_failed'));
      }
    } catch (err) {
      console.error('Lỗi khi xóa giỏ hàng:', err);
      alert(t('t_failed'));
    }
  };

  const handleCreateDraft = async () => {
    if (selectedItem.length == 0) {
      toast.warning(t('t_select_warning'), {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    const vouchers = await getTwoRandomVoucherCodes();

    try {
      // const existing = await getOrderDrafts();
      // if (existing.success && existing.draft) {
      //   toast.info(t('t_pending_payment'), {
      //     duration: 4000,
      //     position: 'top-right',
      //   });
      //   router.push('/checkout');
      //   return;
      // }

      const data = {
        notes: '',
        items: selectedItem,
        voucher: [
          {
            code: vouchers.voucher1,
          },
          {
            code: vouchers.voucher2,
          },
        ],
      };
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));

      const res = await createOrderDraft(formData);

      if (res.success) {
        toast.success(t('t_direct_payment'));
        router.push('/checkout');
      } else if (!res.success && res.redirectTo) {
        toast.error(res.message, {
          position: 'top-right',
          duration: 3000,
        });
        router.push(res.redirectTo);
      } else {
        toast.error('Lỗi: ' + res.error);
        console.error(res.error);
      }
    } catch (e) {
      console.error('Lỗi khi tạo đơn hàng nháp:', e);
      toast.error(`Lỗi: ${e}`);
    }
  };

  if (!cart || !cart.items || cart.items.length == 0) {
    noItems = true;
  }
  return (
    <div className="min-h-screen w-full bg-background-darker">
      <div className="w-3/4 mx-auto py-6">
        {/* title */}
        <h1 className="text-xl font-semibold mb-4 text-foreground flex flex-row gap-3 justify-start items-center">
          <CiShoppingBasket size={40} />
          {t('t_title')}
        </h1>

        {/* layout chính */}
        <div className="grid grid-cols-4 gap-6">
          {/* giỏ hàng */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* header */}
            <div className="bg-background-secondary rounded-lg shadow-xs">
              <div className="grid grid-cols-[45%_15%_15%_15%_10%] px-4 py-2 gap-2 items-center h-full text-text">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="choose-all"
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItem(
                          cart.items.map((item: any) => ({
                            productId: item.variant.productId,
                            variantId: item.variant.id,
                            quantity: item.quantity,
                          }))
                        );
                      } else {
                        setSelectedItem([]);
                      }
                    }}
                  />
                  <Label htmlFor="choose-all" className="text-foreground">
                    {t('t_select_all')}
                  </Label>
                </div>
                <div className="text-center font-semibold text-foreground">
                  {t('t_unit_price')}
                </div>
                <div className="text-center font-semibold text-foreground">
                  {t('t_quantity')}
                </div>
                <div className="text-center font-semibold text-foreground">
                  {t('t_total')}
                </div>
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => clearCart()}>
                    <TrashIcon className="w-5 h-5 text-primary" />
                  </Button>
                </div>
              </div>
            </div>

            {/* danh sách sản phẩm */}
            <div className="bg-background-secondary rounded-2xl shadow-xs divide-y">
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary" />
                </div>
              )}
              {noItems && (
                <div className="p-4 text-center text-text-secondary">
                  {t('t_empty_cart')}
                </div>
              )}
              {cart.items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[45%_15%_15%_15%_10%] text-text p-4 gap-2 items-center"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={item.id}
                      checked={selectedItem.some(
                        (object) => object.variantId === item.variant.id
                      )}
                      onCheckedChange={(checked) => {
                        setSelectedItem((prev: itemType[]) =>
                          checked
                            ? [
                                ...prev,
                                {
                                  productId: item.variant.productId,
                                  variantId: item.variant.id,
                                  quantity: item.quantity,
                                },
                              ]
                            : prev.filter(
                                (object: itemType) =>
                                  object.variantId !== item.variant.id
                              )
                        );
                      }}
                    />
                    <Image
                      src={item.variant.product.images[0].url}
                      alt={item.variant.product.alt || 'Product image'}
                      width={64}
                      height={64}
                      className="object-cover rounded-md"
                    />
                    <div className="flex flex-col justify-start items-left gap-1 overflow-ellipsis">
                      <Label
                        htmlFor={item.variant.product.title}
                        className="text-foreground"
                      >
                        {item.variant.product.title}
                      </Label>
                      <Label
                        htmlFor={item.id}
                        className="text-muted-foreground"
                      >
                        {item.variant.name}
                      </Label>
                    </div>
                  </div>
                  <div className="text-center text-foreground">
                    {formatPrice(item.variant.price, {
                      currency: c('t_currency'),
                      rate: Number(c('t_rate')),
                    })}
                  </div>
                  <div className="flex gap-2 items-center justify-center">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateLocalQuantity(item.variant.id, item.quantity - 1)
                      }
                    >
                      -
                    </Button>
                    <Label htmlFor={item.id} className="text-foreground">
                      {item.quantity}
                    </Label>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={item.quantity >= item.variant.stock}
                      onClick={() =>
                        updateLocalQuantity(item.variant.id, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-center text-foreground">
                    {formatPrice(item.quantity * item.variant.price, {
                      currency: c('t_currency'),
                      rate: Number(c('t_rate')),
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mx-auto"
                    onClick={() => removeItem(item.variant.id)}
                  >
                    <TrashIcon className="w-5 h-5 text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* cột phải: khuyến mãi + thanh toán */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Voucher */}
            <div className="flex flex-col bg-background-secondary rounded-2xl shadow-xs p-4 gap-3">
              <div className="flex items-center gap-3 justify-between">
                <Label htmlFor="title" className="text-foreground">
                  {t('t_promotion')}
                </Label>
                <Label
                  htmlFor="disable"
                  className="text-text-secondary cursor-not-allowed select-none"
                >
                  Có thể áp dụng 2
                </Label>
              </div>
              {/* voucher items */}
              <div className="space-y-3">
                {/* voucher 1 */}
                <div className="flex items-center justify-between bg-primary/10 border border-primary/50 rounded-xl p-3 shadow-sm">
                  <div className="shrink-0 w-12 h-12 bg-info/80 rounded-lg flex overflow-hidden items-center justify-center text-primary-foreground font-bold text-xl">
                    {env.NEXT_PUBLIC_WEB_NAME}
                  </div>
                  <div className="mx-3 w-px h-8 border-r border-dashed border-primary"></div>
                  <div className="flex-1 flex items-center gap-2 text-primary text-sm">
                    <span>Giảm 6% tối đa...</span>
                  </div>
                  <button className="bg-info/60 hover:bg-info text-primary-foreground px-2 py-1 rounded-md text-sm font-medium transition">
                    Bỏ Chọn
                  </button>
                </div>
                {/* voucher 2 */}
                <div className="flex items-center justify-between bg-primary/5 border border-primary/50 rounded-xl p-3 shadow-sm">
                  <div className="shrink-0 w-12 h-12 bg-success/70 rounded-lg flex items-center justify-center">
                    <Image
                      width={8}
                      height={8}
                      src="/free-shipping-100.png"
                      alt="..."
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="mx-3 w-px h-8 border-r border-dashed border-primary"></div>
                  <div className="flex-1 flex items-center gap-2 text-primary text-sm">
                    <span>Giảm 6% tối đa...</span>
                  </div>
                  <button className="bg-success/60 hover:bg-success text-primary-foreground px-2 py-1 rounded-md text-sm font-medium transition">
                    Bỏ Chọn
                  </button>
                </div>
              </div>
              <div className="w-full p-0 overflow-hidden">
                <Button
                  variant="link"
                  className="cursor-pointer mt-2 items-center p-0"
                >
                  <TicketIcon className="w-5 h-5 text-primary" />
                  <p className="text-primary">
                    Mua thêm để nhận freeship lên đến 300k ...
                  </p>
                </Button>
              </div>
            </div>

            {/* Payment info */}
            <div className="flex flex-col justify-evenly bg-background-secondary rounded-2xl shadow-xs p-4 gap-3">
              <div className="flex items-center gap-3 justify-between">
                <p className="text-text-secondary text-sm">{t('t_total')}</p>
                <p>
                  {cart.items
                    .filter((item: any) =>
                      selectedItem.some(
                        (object) => object.variantId === item.variant.id
                      )
                    )
                    .reduce(
                      (total: number, item: any) =>
                        total + Number(item.variant.price) * item.quantity,
                      0
                    )
                    .toLocaleString('vi-VN')}{' '}
                  ₫
                </p>
              </div>
              <div className="flex items-center gap-3 justify-between">
                <p className="text-text-secondary text-sm">{t('t_discount')}</p>
                <p className="text-success">
                  -
                  {cart.items
                    .filter((item) =>
                      selectedItem.some(
                        (object) => object.variantId === item.variant.id
                      )
                    )
                    .reduce(
                      (total: number, item: any) =>
                        total +
                        (Number(item.variant.price) * item.quantity) / 10,
                      0
                    )
                    .toLocaleString('vi-VN')}{' '}
                  ₫
                </p>
              </div>
              <Separator />
              <div className="flex items-center gap-3 justify-between">
                <p className="text-text-secondary text-sm">
                  {t('t_total_payment')}
                </p>
                <p className="text-error">
                  {cart.items
                    .filter((item: any) =>
                      selectedItem.some(
                        (object) => object.variantId === item.variant.id
                      )
                    )
                    .reduce(
                      (total: number, item: any) =>
                        total +
                        (Number(item.variant.price) * item.quantity -
                          (Number(item.variant.price) * item.quantity) / 10),
                      0
                    )
                    .toLocaleString('vi-VN')}{' '}
                  ₫
                </p>
              </div>
              <Button
                onClick={handleCreateDraft}
                variant="default"
                className="w-full cursor-pointer"
              >
                {t('t_by_action')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
