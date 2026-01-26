'use client';

import { Loader2, Search, X } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/app/(public)/(customer)/customer/account/orders/_components/no-order-found';
import { useTranslations } from 'next-intl';
import { PaginationState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SellerShopListItem } from '@/app/(seller)/seller/shops/page';
import { fetchApi } from '@/lib/client-fetch';
import {
  VoucherResponseData,
  VoucherResponseDTO,
} from '@/features/voucher/voucher.dto';
import { DataTable } from './_components/voucher-data-table';
import { columns } from '@/app/(seller)/seller/voucher/_components/voucher-column-table';
import { CreateVoucherDialog } from '@/app/(seller)/seller/voucher/_components/create-voucher-dialog';
import { paths } from '@/lib/path';

const LIMIT = 12;

export default function SellerVoucherPage() {
  // i18n
  const t = useTranslations('seller.voucher_page');

  // set data
  const [vouchers, setVouchers] = useState<VoucherResponseDTO[]>([]);
  const [shops, setShops] = useState<SellerShopListItem[]>([]);

  // state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // props func
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  //filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [shopId, setShopId] = useState<string>('all');
  const [type, setType] = useState<string>('all');

  // Call back func for child component
  const handleRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  // func fetch orders with filter
  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiPage = pagination.pageIndex + 1;
      const params = new URLSearchParams();
      params.append('limit', LIMIT.toString()); //Limit params ?limit=12
      if (debouncedSearch) params.append('search', debouncedSearch); //Search params ?search=...
      params.append('page', apiPage.toString()); //Page params ?page=...
      if (type !== 'all') params.append('type', type); //TimeRange params ?timeRange=...
      if (shopId !== 'all') params.append('shopId', shopId); //Shop params ?shopId=...

      const res = await fetchApi<VoucherResponseData>(
        `/api/seller/vouchers?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );

      if (res.success && res.data) {
        const { vouchers: voucherResponse, pagination: newPagination } =
          res.data;
        setVouchers(voucherResponse);
        setPageCount(newPagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [shopId, type, debouncedSearch, pagination.pageIndex]);

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
    setVouchers([]);
    setIsInitialLoad(true);
    fetchVouchers();
  }, [
    fetchVouchers,
    refreshIndex,
    pagination.pageIndex,
    pagination.pageSize,
    shopId,
    type,
    debouncedSearch,
  ]);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      <div className="flex w-full flex-col gap-6">
        {/* Tab Trigger for status change fetch */}
        <Tabs>
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
                value={type}
                onValueChange={(val) => {
                  setType(val);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" disabled>
                    {' '}
                    all{' '}
                  </SelectItem>
                  <SelectItem value="FIX">Cố định</SelectItem>
                  <SelectItem value="PERCENT">Phần trăm</SelectItem>
                  <SelectItem value="SHIPPING">Vận chuyển</SelectItem>
                </SelectContent>
              </Select>
              {/*<Popover>*/}
              {/*  <PopoverTrigger asChild>*/}
              {/*    <Button*/}
              {/*      variant={'outline'}*/}
              {/*      className={cn(*/}
              {/*        'w-[200px] justify-start text-left font-normal',*/}
              {/*        'text-muted-foreground'*/}
              {/*      )}*/}
              {/*    >*/}
              {/*      <CalendarIcon className="mr-2 h-4 w-4" />*/}
              {/*    </Button>*/}
              {/*  </PopoverTrigger>*/}
              {/*  <PopoverContent className="w-auto p-0" align="start">*/}
              {/*    <Calendar*/}
              {/*      mode="single"*/}
              {/*      captionLayout="dropdown"*/}
              {/*      autoFocus={true}*/}
              {/*      locale={vi}*/}
              {/*    />*/}
              {/*  </PopoverContent>*/}
              {/*</Popover>*/}
              <CreateVoucherDialog onSuccess={handleRefresh} shops={shops} />
              {(searchTerm || type !== 'all' || shopId !== 'all') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm('');
                    setType('all');
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
          <TabsContent value="" className=" mt-3 w-full space-y-6">
            {isInitialLoad && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">
                  Đang tải dữ liệu...
                </p>
              </div>
            )}

            {!isInitialLoad && vouchers.length > 0 ? (
              <div className="bg-background-secondary border-border border-2 rounded-lg">
                <DataTable
                  columns={columns(t, handleRefresh)}
                  data={vouchers as VoucherResponseDTO[]}
                  pageCount={pageCount}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                />

                {isLoading && (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              !isInitialLoad && (
                <div className="py-10 bg-card rounded-xl border border-dashed border-border">
                  <EmptyState
                    imageSrc="/no-voucher.jpg"
                    title="Chưa có voucher nào"
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
