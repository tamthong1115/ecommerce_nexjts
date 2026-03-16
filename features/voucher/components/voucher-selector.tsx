'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TicketPercent, Loader2, Store, Globe, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/client-fetch';
import { VoucherDTO } from '@/features/voucher/types/voucher.dto';
import { Separator } from '@/components/ui/separator';

interface VoucherSelectorProps {
  shopId: string;
  productId?: string;
  currentPrice: number;
  selectedVouchers: VoucherDTO[];
  onApply: (vouchers: VoucherDTO[]) => void;
}

export function VoucherSelector({
  shopId,
  productId,
  currentPrice,
  selectedVouchers,
  onApply,
}: VoucherSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<VoucherDTO[]>([]);

  // Local state for the sheet before applying
  const [tempSelected, setTempSelected] =
    useState<VoucherDTO[]>(selectedVouchers);

  useEffect(() => {
    if (isOpen) {
      // Reset temp state to match parent state when opening
      setTempSelected(selectedVouchers);
    }
  }, [isOpen, selectedVouchers]);

  // Fetch data
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const params = new URLSearchParams({ shopId });
      if (productId) params.append('productId', productId);

      fetchApi<VoucherDTO[]>(`/api/vouchers?${params.toString()}`)
        .then((res) => {
          if (res.success && res.data) {
            setAvailableVouchers(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, shopId, productId]);

  const handleToggle = (voucher: VoucherDTO) => {
    // 1. Check Min Subtotal Condition
    if (currentPrice < voucher.minSubtotal) {
      toast.warning(
        `Order value must be at least ${formatPrice(voucher.minSubtotal)}`
      );
      return;
    }

    setTempSelected((prev) => {
      const isAlreadySelected = prev.some((v) => v.code === voucher.code);

      if (isAlreadySelected) {
        // Deselect
        return prev.filter((v) => v.code !== voucher.code);
      }

      // Determine scope for voucher selection: SHOP | SHIPPING | PLATFORM
      const scope =
        voucher.type === 'SHIPPING'
          ? 'SHIPPING'
          : voucher.shopId
            ? 'SHOP'
            : 'PLATFORM';

      // Filter out any existing voucher of the same scope
      const others = prev.filter((v) => {
        const vScope =
          v.type === 'SHIPPING' ? 'SHIPPING' : v.shopId ? 'SHOP' : 'PLATFORM';
        return vScope !== scope;
      });

      // Return others + new selection
      return [...others, voucher];
    });
  };

  const handleApply = () => {
    onApply(tempSelected);
    setIsOpen(false);
    toast.success('Vouchers applied successfully');
  };

  // Helper to render groups
  const renderVoucherList = (
    title: string,
    vouchers: VoucherDTO[],
    icon: React.ReactNode
  ) => {
    if (vouchers.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
          {icon} {title}
        </div>
        <div className="space-y-3">
          {vouchers.map((voucher) => {
            const isSelected = tempSelected.some(
              (v) => v.code === voucher.code
            );
            const isDisabled = currentPrice < voucher.minSubtotal;

            return (
              <div
                key={voucher.id}
                className={`
                  relative border rounded-xl p-3 transition-all
                  ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'hover:border-primary/50 cursor-pointer'}
                `}
                onClick={() => !isDisabled && handleToggle(voucher)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-base text-primary">
                        {voucher.type === 'PERCENT'
                          ? `${voucher.value}% OFF`
                          : `-${formatPrice(voucher.value)}`}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {voucher.code}
                      </Badge>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Min spend: {formatPrice(voucher.minSubtotal)}
                      </p>
                      {voucher.maxDiscount > 0 &&
                        voucher.type === 'PERCENT' && (
                          <p className="text-xs text-muted-foreground">
                            Max discount: {formatPrice(voucher.maxDiscount)}
                          </p>
                        )}
                      {isDisabled && (
                        <p className="text-xs text-destructive font-medium mt-1">
                          Not eligible (Min: {formatPrice(voucher.minSubtotal)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Group vouchers
  const shippingVouchers = availableVouchers.filter(
    (v) => v.type === 'SHIPPING'
  );
  const shopVouchers = availableVouchers.filter(
    (v) => !!v.shopId && v.type !== 'SHIPPING'
  );
  const platformVouchers = availableVouchers.filter(
    (v) => !v.shopId && v.type !== 'SHIPPING'
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="flex flex-row justify-between items-center w-full bg-background-secondary p-4 rounded-lg cursor-pointer border border-transparent hover:border-primary/20 transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <TicketPercent className="text-primary" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Vouchers</span>
              <span className="text-xs text-muted-foreground">
                {selectedVouchers.length > 0
                  ? `Save -${formatPrice(
                      selectedVouchers.reduce((acc, v) => {
                        // Rough estimate for display, exact calc happens in parent
                        if (v.type === 'FIXED') return acc + v.value;
                        return acc + (currentPrice * v.value) / 100;
                      }, 0)
                    )}`
                  : 'Select vouchers to apply'}
              </span>
            </div>
          </div>
          <Badge
            variant={selectedVouchers.length > 0 ? 'default' : 'secondary'}
          >
            {selectedVouchers.length > 0
              ? `${selectedVouchers.length} Applied`
              : 'Select'}
          </Badge>
        </div>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[450px] flex flex-col h-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Select Vouchers</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="px-3">
                  {renderVoucherList(
                    'Shop Vouchers',
                    shopVouchers,
                    <Store size={14} />
                  )}
                </div>
                {shippingVouchers.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="px-3">
                      {renderVoucherList(
                        'Shipping Vouchers',
                        shippingVouchers,
                        <Truck size={14} />
                      )}
                    </div>
                  </>
                )}

                {(shopVouchers.length > 0 || shippingVouchers.length > 0) &&
                  platformVouchers.length > 0 && <Separator className="my-4" />}
                <div className="px-3">
                  {renderVoucherList(
                    'Platform Vouchers',
                    platformVouchers,
                    <Globe size={14} />
                  )}
                </div>
                {shopVouchers.length === 0 && platformVouchers.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No vouchers available
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 mt-auto border-t">
          <Button onClick={handleApply} className="w-full" disabled={loading}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
