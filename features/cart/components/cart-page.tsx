'use client';

import { createOrderDraft } from '@/app/actions/order_draft';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useVouchers } from '@/features/voucher/hooks/use-vouchers';
import { VoucherResponseDTO } from '@/features/voucher/types/voucher.dto';
import { formatPrice } from '@/lib/utils';
import { TicketIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CiShoppingBasket } from 'react-icons/ci';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import {
  useCart,
  useClearCart,
  useRemoveItem,
  useUpdateCart,
} from '../hooks/use-cart';

type itemType = {
  productId: string;
  variantId: string;
  quantity: number;
};

export default function CartPage() {
  const router = useRouter();
  const t = useTranslations('cart_page');
  const c = useTranslations('general');

  const { data: cart, isLoading } = useCart();
  const updateCartMutation = useUpdateCart();
  const removeItemMutation = useRemoveItem();
  const clearCartMutation = useClearCart();

  // Voucher Hook
  const {
    data: availableVouchers,
    isLoading: isLoadingVouchers,
    filters: voucherFilters,
  } = useVouchers({ limit: 10 });

  const [selectedItem, setSelectedItem] = useState<itemType[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<
    VoucherResponseDTO[]
  >([]);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);

  const items = cart?.items || [];
  const noItems = !isLoading && items.length === 0;

  const allSelected =
    items.length > 0 &&
    items.every((item) =>
      selectedItem.some((obj) => obj.variantId === item.variant.id)
    );

  const updateQuantity = useDebouncedCallback(
    (variantId: string, quantity: number) => {
      if (quantity < 1) return;
      updateCartMutation.mutate([{ variant: { id: variantId }, quantity }]);
    },
    500
  );

  const selectedItemsData = items.filter((item: any) =>
    selectedItem.some((obj) => obj.variantId === item.variant.id)
  );
  const subtotal = selectedItemsData.reduce(
    (total: number, item: any) =>
      total + Number(item.variant.price) * item.quantity,
    0
  );

  const handleVoucherToggle = (voucher: VoucherResponseDTO) => {
    setSelectedVouchers((prev) => {
      const exists = prev.find((v) => v.id === voucher.id);
      if (exists) {
        return prev.filter((v) => v.id !== voucher.id);
      } else {
        // Simple logic: allow only one voucher for now, or multiple if backend supports it
        // For now replacing the existing one to be safe, or you can push to array
        return [voucher];
      }
    });
    setIsVoucherDialogOpen(false);
  };

  const handleCreateDraft = async () => {
    if (selectedItem.length == 0) {
      toast.warning(t('t_select_warning'), {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    try {
      const data = {
        notes: '',
        items: selectedItem,
        voucher: selectedVouchers.map((v) => ({ code: v.code })),
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary" />
      </div>
    );
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
                          items.map((item: any) => ({
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('t_remove_all')))
                        clearCartMutation.mutate();
                    }}
                  >
                    <TrashIcon className="w-5 h-5 text-primary" />
                  </Button>
                </div>
              </div>
            </div>

            {/* danh sách sản phẩm */}
            <div className="bg-background-secondary rounded-2xl shadow-xs divide-y">
              {noItems && (
                <div className="p-4 text-center text-text-secondary">
                  {t('t_empty_cart')}
                </div>
              )}
              {items.map((item: any) => (
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
                        updateQuantity(item.variant.id, item.quantity - 1)
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
                        updateQuantity(item.variant.id, item.quantity + 1)
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
                    onClick={() => {
                      if (confirm(t('t_remove_item_confirm')))
                        removeItemMutation.mutate(item.variant.id);
                    }}
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
                <Label className="text-foreground">{t('t_promotion')}</Label>
                <Dialog
                  open={isVoucherDialogOpen}
                  onOpenChange={setIsVoucherDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto font-normal"
                    >
                      {t('t_select_voucher', {
                        defaultValue: 'Select Voucher',
                      })}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-background">
                    <DialogHeader>
                      <DialogTitle>
                        {t('t_select_voucher', {
                          defaultValue: 'Select Voucher',
                        })}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Search voucher code..."
                        className="mb-4"
                        value={voucherFilters.searchTerm}
                        onChange={(e) =>
                          voucherFilters.setSearchTerm(e.target.value)
                        }
                      />
                      <ScrollArea className="h-[300px] w-full pr-4">
                        {isLoadingVouchers ? (
                          <div className="text-center py-4 text-muted-foreground">
                            Loading...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableVouchers?.map((voucher) => (
                              <div
                                key={voucher.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedVouchers.some(
                                    (v) => v.id === voucher.id
                                  )
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-accent'
                                }`}
                                onClick={() => handleVoucherToggle(voucher)}
                              >
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {voucher.code}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {voucher.description}
                                  </p>
                                </div>
                                {selectedVouchers.some(
                                  (v) => v.id === voucher.id
                                ) && (
                                  <TicketIcon className="text-primary w-5 h-5" />
                                )}
                              </div>
                            ))}
                            {(!availableVouchers ||
                              availableVouchers.length === 0) && (
                              <p className="text-center text-muted-foreground">
                                No vouchers found
                              </p>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {selectedVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between p-2 bg-accent/20 rounded border border-primary/20"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {voucher.code}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setSelectedVouchers((prev) =>
                          prev.filter((v) => v.id !== voucher.id)
                        )
                      }
                    >
                      <TrashIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment info */}
            <div className="flex flex-col justify-evenly bg-background-secondary rounded-2xl shadow-xs p-4 gap-3">
              <div className="flex items-center gap-3 justify-between">
                <p className="text-text-secondary text-sm">{t('t_total')}</p>
                <p className="text-foreground">
                  {items
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
                  {items
                    .filter((item: any) =>
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
                <p className="text-error font-semibold">
                  {items
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
