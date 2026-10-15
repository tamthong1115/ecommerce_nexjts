'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import { PaginationState, OnChangeFn } from '@tanstack/react-table';

export interface UseServerTableQueryOptions {
  defaultPage?: number;
  defaultLimit?: number;
  pageParamKey?: string;
  limitParamKey?: string;
}

/**
 * Hook to synchronize table pagination and filter state with URL search parameters.
 */
export function useServerTableQuery(options: UseServerTableQueryOptions = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    pageParamKey = 'page',
    limitParamKey = 'limit',
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const page = useMemo(() => {
    const raw = searchParams.get(pageParamKey);
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultPage;
  }, [searchParams, pageParamKey, defaultPage]);

  const limit = useMemo(() => {
    const raw = searchParams.get(limitParamKey);
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultLimit;
  }, [searchParams, limitParamKey, defaultLimit]);

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: Math.max(0, page - 1),
      pageSize: limit,
    }),
    [page, limit]
  );

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | null | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      });
      return current.toString();
    },
    [searchParams]
  );

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updaterOrValue) => {
      const nextPagination =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(pagination)
          : updaterOrValue;

      const newPage = nextPagination.pageIndex + 1;
      const newLimit = nextPagination.pageSize;

      const qs = createQueryString({
        [pageParamKey]: newPage,
        [limitParamKey]: newLimit !== defaultLimit ? newLimit : null,
      });

      startTransition(() => {
        router.push(`${pathname}?${qs}`, { scroll: false });
      });
    },
    [pagination, createQueryString, pageParamKey, limitParamKey, defaultLimit, pathname, router]
  );

  const setParam = useCallback(
    (key: string, value: string | number | null | undefined, resetPage = true) => {
      const qs = createQueryString({
        [key]: value,
        ...(resetPage ? { [pageParamKey]: 1 } : {}),
      });

      startTransition(() => {
        router.push(`${pathname}?${qs}`, { scroll: false });
      });
    },
    [createQueryString, pageParamKey, pathname, router]
  );

  return {
    page,
    limit,
    pagination,
    onPaginationChange,
    setParam,
    isPending,
    createQueryString,
  };
}
