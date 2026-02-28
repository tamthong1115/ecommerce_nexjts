import { useState, useCallback, useEffect } from 'react';
import { PaginationState } from '@tanstack/react-table';
import { VoucherResponseDTO } from '@/features/voucher/types/voucher.dto';
import { getVouchers } from '@/features/voucher/hooks/voucher.client';

interface UseVouchersProps {
  limit?: number;
  initialShopId?: string;
  isManager?: boolean;
}

export function useVouchers({
  limit = 12,
  initialShopId = 'all',
  isManager = false,
}: UseVouchersProps = {}) {
  const [vouchers, setVouchers] = useState<VoucherResponseDTO[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [shopId, setShopId] = useState<string>(initialShopId);
  const [type, setType] = useState<string>('all');
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getVouchers(
        {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: debouncedSearch,
          type,
          shopId,
        },
        isManager
      );

      if (res.success && res.data) {
        setVouchers(res.data.vouchers);
        setPageCount(res.data.pagination.totalPages);
      } else {
        setVouchers([]);
        setPageCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch vouchers', error);
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    type,
    shopId,
    refreshIndex,
    isManager,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  return {
    data: vouchers,
    pageCount,
    isLoading,
    pagination,
    setPagination,
    filters: {
      searchTerm,
      setSearchTerm,
      shopId,
      setShopId,
      type,
      setType,
    },
    refresh,
  };
}
