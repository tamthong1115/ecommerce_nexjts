'use client';

import { CalendarIcon, Loader2, Search, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/app/(public)/(customer)/customer/account/orders/_components/no-order-found';
import { $Enums } from '@/lib/generated/prisma';
import OrderStatus = $Enums.OrderStatus;
import { DataTable } from '@/app/(seller)/seller/orders/_components/order-data-table';
import { columns } from '@/app/(seller)/seller/orders/_components/order-column-table';
import { OrderDTO } from '@/types/dtos/order.dto';
import { useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { PaginationState } from '@tanstack/react-table';
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
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { vi } from 'date-fns/locale';
import { SellerShopListItem } from '@/app/(seller)/seller/shops/page';
import { fetchApi } from '@/lib/client-fetch';
import { SellerOrderDetails } from '@/app/(seller)/seller/orders/_components/order-details';
import { UpdateOrderStatus } from '@/app/(seller)/seller/orders/_components/update-order-status';
import { paths } from '@/lib/path';

type OrderResponseData = {
  orders: OrderDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  nextCursor?: string | null;
};
const LIMIT = 12;

export default function SellerOrderPage() {
  // i18n
  const t = useTranslations('seller.order_page');

  // set data with active tabs
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');

  // set data
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [shops, setShops] = useState<SellerShopListItem[]>([]);

  // state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // props func
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // var for cursor
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  //filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [shopId, setShopId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [date, setDate] = useState<Date | undefined>(undefined);

  //Observer to check last item for cursor
  const observer = useRef<IntersectionObserver | null>(null);

  // Call back func for child component
  const handleRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  // func fetch orders with filter
  const fetchOrders = useCallback(
    async (isNewTab = false, cursor?: string | null) => {
      setIsLoading(true);
      try {
        const apiPage = pagination.pageIndex + 1;
        const params = new URLSearchParams();
        params.append('limit', LIMIT.toString()); //Limit params ?limit=12
        if (activeTab !== 'ALL') params.append('status', activeTab); //Status params ?status=...
        if (debouncedSearch) params.append('search', debouncedSearch); //Search params ?search=...
        // if (cursor) params.append('cursor', cursor);
        params.append('page', apiPage.toString()); //Page params ?page=...
        if (timeRange !== 'none') params.append('timeRange', timeRange); //TimeRange params ?timeRange=...
        if (date) params.append('date', date.toString()); //Date params ?date=...
        if (shopId !== 'all') params.append('shopId', shopId); //Shop params ?shopId=...

        const res = await fetchApi<OrderResponseData>(
          `/api/seller/orders?${params.toString()}`,
          {
            cache: 'no-store',
          }
        );

        if (res.success && res.data) {
          const {
            orders: newOrders,
            pagination: newPagination,
            nextCursor: newCursor,
          } = res.data;
          setOrders((prev) => (isNewTab ? newOrders : [...prev, ...newOrders]));
          // setNextCursor(res.data.nextCursor);
          // setHasMore(!!res.data.nextCursor);
          setPageCount(newPagination.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [activeTab, shopId, timeRange, date, debouncedSearch, pagination.pageIndex]
  );

  // delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch shop
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi(paths.seller.shops.api.fetch_all);
        const data = (res.data as SellerShopListItem[]) ?? [];
        if (active) {
          setShops(data);
        }
      } catch (e: any) {
        if (active) {
          setError(e.message || 'Error');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  //Reload data if condition change
  useEffect(() => {
    setOrders([]);
    setNextCursor(null);
    setHasMore(true);
    setIsInitialLoad(true);
    fetchOrders(true, null);
  }, [
    activeTab,
    fetchOrders,
    refreshIndex,
    pagination.pageIndex,
    pagination.pageSize,
    shopId,
    date,
    timeRange,
    debouncedSearch,
  ]);

  // fucn load more item if scrolling at last list of orders
  const lastOrderElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && nextCursor) {
          fetchOrders(false, nextCursor);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, nextCursor, fetchOrders]
  );

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      <div className="flex w-full flex-col gap-6">
        {/* Tab Trigger for status change fetch */}
        <Tabs
          defaultValue="ALL"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/40 p-1 rounded-xl shadow-inner">
            <TabItem value="ALL" label="Tất cả" count={null} />
            <TabItem
              value={OrderStatus.AWAITING_PAYMENT}
              label="Chờ thanh toán"
            />
            <TabItem value={OrderStatus.PROCESSING} label="Cần xử lý" />
            <TabItem value={OrderStatus.SHIPPED} label="Đang vận chuyển" />
            <TabItem value={OrderStatus.DELIVERED} label="Đã giao" />
            <TabItem value={OrderStatus.CANCELED} label="Đã hủy" />
          </TabsList>

          {/* Filter */}
          <div className="flex items-center justify-between gap-4 p-4 mt-3 bg-background-secondary border border-border rounded-lg shadow-sm">
            <div className="w-1/4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={shopId}
                onValueChange={(id) => {
                  setShopId(id);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choose shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" disabled>
                    {' '}
                    ALL{' '}
                  </SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={timeRange}
                onValueChange={(val) => {
                  setTimeRange(val);
                  setDate(undefined);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    {' '}
                    none{' '}
                  </SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">Tuần này</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[200px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày cụ thể</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setTimeRange('custom');
                    }}
                    captionLayout="dropdown"
                    autoFocus={true}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              {(searchTerm ||
                timeRange !== 'none' ||
                date ||
                shopId !== 'all') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm('');
                    setTimeRange('none');
                    setDate(undefined);
                    setShopId('all');
                  }}
                  title="Xóa bộ lọc"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Data */}
          <TabsContent value={activeTab} className=" mt-3 w-full space-y-6">
            {isInitialLoad && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">
                  Đang tải dữ liệu...
                </p>
              </div>
            )}

            {activeTab === 'ALL' && !isInitialLoad && orders.length > 0 ? (
              <div className="bg-background-secondary border-border border-2 rounded-lg">
                <DataTable
                  columns={columns(t, handleRefresh)}
                  data={orders as OrderDTO[]}
                  pageCount={pageCount}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                />
              </div>
            ) : !isInitialLoad && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order, index) => {
                  const isLastElement = orders.length === index + 1;
                  return (
                    <div
                      key={order.id}
                      ref={isLastElement ? lastOrderElementRef : null}
                    >
                      <SellerOrderCard
                        order={order}
                        t={t}
                        onUpdateSuccess={handleRefresh}
                      />
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!hasMore && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Đã hiển thị hết đơn hàng.
                  </p>
                )}
              </div>
            ) : (
              !isInitialLoad && (
                <div className="py-10 bg-card rounded-xl border border-dashed border-border">
                  <EmptyState
                    imageSrc="/empty-order.png"
                    title="Chưa có đơn hàng nào ở trạng thái này"
                  />
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TabItem({
  value,
  label,
}: {
  value: string;
  label: string;
  count?: number | null;
}) {
  return (
    <TabsTrigger
      value={value}
      className="px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
    >
      {label}
    </TabsTrigger>
  );
}

function SellerOrderCard({
  order,
  t,
  onUpdateSuccess,
}: {
  order: OrderDTO;
  t: ReturnType<typeof useTranslations>;
  onUpdateSuccess: () => void;
}) {
  const statusColor: Record<string, string> = {
    AWAITING_PAYMENT: 'bg-warning/15 text-warning border-warning/30',
    PROCESSING: 'bg-info/15 text-info border-info/30',
    SHIPPED: 'bg-primary/15 text-primary border-primary/30',
    DELIVERED: 'bg-success/15 text-success border-success/30',
    CANCELED: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  const c = useTranslations('general');

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow border border-border overflow-hidden">
      <CardHeader className="bg-muted/10 py-3 px-4 flex flex-row justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-foreground">
            #{order.orderNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(order.placedAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`border ${statusColor[order.status] || 'bg-muted'}`}
        >
          {order.status}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-4 overflow-y-scroll h-20">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 items-start">
            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-muted shrink-0">
              <Image
                src={item.product.images[0]?.url || '/placeholder.png'}
                alt={item.product.title ? item.product.title : ',,,'}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-foreground truncate"
                title={item.product.title}
              >
                {item.product.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Phân loại: {item.title}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                x{item.quantity}
              </p>
              <p className="text-sm text-primary font-semibold mt-1">
                {formatPrice(item.total, {
                  currency: c('t_currency'),
                  rate: Number(c('t_rate')),
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="bg-muted/5 py-3 px-4 flex justify-between items-center border-t border-border">
        <div className="text-sm text-foreground">
          Tổng thu:{' '}
          <span className="text-lg font-bold text-primary">
            {formatPrice(order.grandTotal, {
              currency: c('t_currency'),
              rate: Number(c('t_rate')),
            })}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant={'outline'}>
            <SellerOrderDetails key={order.id} item={order} t={t} />
          </Button>
          <Button variant="outline">
            <UpdateOrderStatus
              key={order.id}
              item={order}
              t={t}
              onUpdateSuccess={onUpdateSuccess}
            />
          </Button>
          {order.status === 'PROCESSING' && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Chuẩn bị hàng
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
