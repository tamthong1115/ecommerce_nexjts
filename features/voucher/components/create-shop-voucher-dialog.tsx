'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarIcon,
  Loader2,
  RefreshCw,
  Check,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

import { fetchApi } from '@/lib/client-fetch';

import { SellerShopListItem } from '@/app/(seller)/seller/shops/page';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  CreateVoucherInput,
  createVoucherSchema,
} from '@/features/voucher/validation';

interface ProductSimple {
  id: string;
  title: string;
  price: number;
  image?: string;
  minPrice: string;
  maxPrice: string;
}

interface CreateVoucherDialogProps {
  shops: SellerShopListItem[];
  onSuccess?: () => void;
}

export function CreateVoucherDialog({
  shops,
  onSuccess,
}: CreateVoucherDialogProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductSimple[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Mở rộng defaultValues để bao gồm shopId
  const form = useForm({
    resolver: zodResolver(createVoucherSchema),
    defaultValues: {
      code: '',
      shopId: '', // Thêm shopId
      type: 'FIXED',
      value: 0,
      minSubtotal: 0,
      currency: 'VND',
      isActive: true,
      productIds: [] as string[],
      startAt: new Date(),
      endAt: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  const watchType = form.watch('type');
  const watchShopId = form.watch('shopId');
  const watchProductIds = form.watch('productIds');

  const generateCode = () => {
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    form.setValue('code', `VC-${randomStr}`);
  };

  // Fetch products khi Shop thay đổi
  useEffect(() => {
    if (open && watchShopId) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const res = await fetchApi<ProductSimple[]>(
            `/api/seller/products?shopId=${watchShopId}`
          );
          if (res.success && res.data) {
            setProducts(res.data);
          } else {
            setProducts([]);
          }
        } catch (error) {
          console.error('Failed to fetch products', error);
          setProducts([]);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setProducts([]); // Clear products nếu không có shop
    }

    if (open && !form.getValues('code')) generateCode();
  }, [open, watchShopId, form]);

  const onSubmit = async (data: CreateVoucherInput) => {
    try {
      const res = await fetchApi('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success) {
        toast.success('Tạo voucher thành công!');
        setOpen(false);
        form.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error('Lỗi kết nối đến máy chủ', error);
    }
  };

  // Helper function để xóa 1 product khỏi danh sách đã chọn
  const handleRemoveProduct = (productId: string) => {
    const current = form.getValues('productIds');
    form.setValue(
      'productIds',
      current!.filter((id) => id !== productId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          Thêm Voucher Mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background-secondary border-none text-text">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text">
            Tạo Voucher Shop
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Tạo mã giảm giá mới cho khách hàng. Các trường dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* --- SECTION 1: CHỌN SHOP --- */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="shopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Áp dụng cho Shop *</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('productIds', []);
                      }}
                      defaultValue={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn Shop của bạn" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            <div className="flex items-center gap-2">
                              {/* Nếu có ảnh shop thì hiển thị ở đây */}
                              <span>{shop.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã Voucher *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="VC-XXXXXXXX"
                          {...field}
                          className="uppercase"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateCode}
                        title="Tạo mã ngẫu nhiên"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loại Voucher */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại giảm giá *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">
                          Giảm tiền trực tiếp (FIXED)
                        </SelectItem>
                        <SelectItem value="PERCENT">
                          Giảm theo % (PERCENT)
                        </SelectItem>
                        <SelectItem value="SHIPPING">
                          Giảm phí ship (SHIPPING)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giá trị giảm {watchType === 'PERCENT' ? '(%)' : '(VND)'} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === 'PERCENT' && (
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giảm tối đa (VND)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="minSubtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn tối thiểu (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- TIME & LIMIT SECTION --- */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value as Date, 'dd/MM/yyyy HH:mm')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value as Date}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value as Date, 'dd/MM/yyyy HH:mm')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value as Date}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tổng lượt sử dụng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Không giới hạn"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perUserLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lượt dùng tối đa/người</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ví dụ: 1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- SECTION 3: CHỌN SẢN PHẨM (COMBO BOX) --- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">
                  Áp dụng cho sản phẩm *
                </FormLabel>
                <span className="text-xs text-text-secondary">
                  {watchShopId
                    ? `Đã chọn: ${watchProductIds?.length || 0} sản phẩm`
                    : 'Vui lòng chọn Shop trước'}
                </span>
              </div>

              <FormField
                control={form.control}
                name="productIds"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover
                      open={isComboboxOpen}
                      onOpenChange={setIsComboboxOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={!watchShopId || isLoadingProducts}
                            className="w-full justify-between h-auto min-h-[40px] py-2"
                          >
                            <span className="truncate text-left font-normal">
                              {field.value && field.value.length > 0
                                ? 'Chọn thêm sản phẩm...'
                                : 'Chọn sản phẩm áp dụng'}
                            </span>
                            {isLoadingProducts ? (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                            ) : (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[600px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Tìm kiếm tên sản phẩm..." />
                          <CommandList>
                            <CommandEmpty>
                              Không tìm thấy sản phẩm.
                            </CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              {products.map((product) => {
                                const isSelected = field.value?.includes(
                                  product.id
                                );
                                return (
                                  <CommandItem
                                    key={product.id}
                                    value={product.title} // Dùng title để search
                                    onSelect={() => {
                                      const current = field.value || [];
                                      if (isSelected) {
                                        field.onChange(
                                          current.filter(
                                            (id) => id !== product.id
                                          )
                                        );
                                      } else {
                                        field.onChange([
                                          ...current,
                                          product.id,
                                        ]);
                                      }
                                      // Giữ combobox mở để chọn tiếp
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                        isSelected
                                          ? 'bg-primary text-primary-foreground'
                                          : 'opacity-50 [&_svg]:invisible'
                                      )}
                                    >
                                      <Check
                                        className={cn(
                                          'h-4 w-4',
                                          isSelected ? 'visible' : 'invisible'
                                        )}
                                      />
                                    </div>

                                    {product.image && (
                                      <Image
                                        src={product.image}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="rounded mr-2 object-cover h-8 w-8"
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <span>{product.title}</span>
                                      <span className="text-xs text-text-secondary">
                                        {formatPrice(product.minPrice)} -{' '}
                                        {formatPrice(product.maxPrice)}
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Hiển thị các sản phẩm đã chọn dưới dạng Tags/Badges */}
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 border rounded-md p-2 bg-background-secondary/50">
                        {field.value.map((id) => {
                          const product = products.find((p) => p.id === id);
                          if (!product) return null; // Nếu sản phẩm không còn trong list (do đổi shop)
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="pl-1 pr-1 py-1 flex items-center gap-1 bg-white dark:bg-zinc-800 border-zinc-200"
                            >
                              {product.image && (
                                <Image
                                  src={product.image}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="rounded object-cover h-5 w-5"
                                />
                              )}
                              <span className="truncate max-w-[200px] text-xs">
                                {product.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(id)}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-confirm text-white hover:bg-confirm/90"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tạo Voucher
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
