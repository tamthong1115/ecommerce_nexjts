'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useServerTableQuery } from './use-server-table-query';
import { useDataTable } from './use-data-table';
import { fetchApi } from '@/lib/client-fetch';

export interface UseTableControllerOptions<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  endpoint?: string;
  extraParams?: Record<string, string | number | boolean | undefined>;
  fetchFn?: (params: { page: number; limit: number; search: string }) => Promise<{
    items: TData[];
    total?: number;
    totalPages?: number;
  }>;
  queryResult?: {
    data?: any;
    isLoading?: boolean;
    error?: any;
    refetch?: () => void;
  };
  mode?: 'server' | 'client';
  defaultLimit?: number;
  getRowId?: (row: TData) => string;
}

export function useTableController<TData, TValue = unknown>({
  columns,
  endpoint,
  extraParams,
  fetchFn,
  queryResult,
  mode = 'server',
  defaultLimit = 10,
  getRowId,
}: UseTableControllerOptions<TData, TValue>) {
  const { page, limit, pagination, onPaginationChange, setParam } =
    useServerTableQuery({ defaultLimit });

  const [search, setSearchState] = useState('');
  const [data, setData] = useState<TData[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const serializedExtraParams = useMemo(
    () => (extraParams ? JSON.stringify(extraParams) : ''),
    [extraParams]
  );

  const loadData = useCallback(async () => {
    if (queryResult) return;

    setLoading(true);
    setError(null);
    try {
      if (fetchFn) {
        const res = await fetchFn({ page, limit, search });
        setData(res.items || []);
        setTotalRows(res.total ?? (res.items?.length || 0));
        setTotalPages(res.totalPages ?? 1);
      } else if (endpoint) {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search ? { search } : {}),
        });

        if (extraParams) {
          Object.entries(extraParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              queryParams.set(k, String(v));
            }
          });
        }
        const res = await fetchApi<{
          items?: TData[];
          data?: TData[];
          total?: number;
          totalPages?: number;
          pagination?: { total: number; totalPages: number };
        }>(`${endpoint}?${queryParams.toString()}`);

        if (res.success && res.data) {
          const items = Array.isArray(res.data)
            ? res.data
            : (res.data as any).items || (res.data as any).data || [];
          const metaPagination = (res as any).meta?.pagination;
          const total =
            metaPagination?.total ??
            (res.data as any).total ??
            (res.data as any).pagination?.total ??
            items.length;
          const pages =
            metaPagination?.totalPages ??
            (res.data as any).totalPages ??
            (res.data as any).pagination?.totalPages ??
            1;

          setData(items);
          setTotalRows(total);
          setTotalPages(pages);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchFn, queryResult, page, limit, search, serializedExtraParams]);

  useEffect(() => {
    if (mode === 'server') {
      loadData();
    }
  }, [loadData, mode]);

  useEffect(() => {
    if (queryResult) {
      const rawData = queryResult.data;
      if (Array.isArray(rawData)) {
        setData(rawData);
        setTotalRows(rawData.length);
      } else if (rawData?.items) {
        setData(rawData.items);
        setTotalRows(rawData.total || rawData.items.length);
        setTotalPages(rawData.totalPages || 1);
      }
      setLoading(!!queryResult.isLoading);
      setError(queryResult.error ? String(queryResult.error?.message || queryResult.error) : null);
    }
  }, [queryResult]);

  const { table } = useDataTable({
    data,
    columns,
    getRowId,
    manualPagination: mode === 'server',
    pageCount: totalPages,
    pagination,
    onPaginationChange,
  });

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearchState(newSearch);
      setParam('search', newSearch);
    },
    [setParam]
  );

  return useMemo(
    () => ({
      table,
      data,
      loading,
      error,
      totalRows,
      totalPages,
      page,
      limit,
      search,
      setSearch: handleSearchChange,
      setParam,
      refetch: queryResult?.refetch || loadData,
      bind: {
        table,
        loading,
        error,
        totalRows,
        search: {
          value: search,
          onChange: handleSearchChange,
          placeholder: 'Search...',
          debounceMs: 300,
        },
      },
    }),
    [
      table,
      data,
      loading,
      error,
      totalRows,
      totalPages,
      page,
      limit,
      search,
      handleSearchChange,
      setParam,
      queryResult?.refetch,
      loadData,
    ]
  );
}

export type TableController<TData> = ReturnType<typeof useTableController<TData>>;
