import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  SortingState,
  TableOptions,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { UniqueIdentifier } from '@dnd-kit/core';

export interface UseDataTableProps<TData, TValue = unknown> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
  enableRowSelection?: boolean | ((row: any) => boolean);

  // Search / Global Filter
  initialSearch?: string;
  search?: string;
  onSearchChange?: (value: string) => void;

  // Pagination options
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  initialPageSize?: number;

  // Sorting & Filtering
  manualSorting?: boolean;
  manualFiltering?: boolean;

  // Initial local states
  initialPagination?: PaginationState;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;

  // Drag and drop option (legacy compatibility)
  enableDragAndDrop?: boolean;
}

export function useDataTable<TData, TValue = unknown>({
  data,
  columns,
  getRowId,
  enableRowSelection = true,
  initialSearch = '',
  search: controlledSearch,
  onSearchChange: controlledOnSearchChange,
  manualPagination = false,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange: controlledOnPaginationChange,
  initialPageSize = 10,
  manualSorting = false,
  manualFiltering = false,
  initialPagination,
  initialSorting = [],
  initialColumnVisibility = {},
  enableDragAndDrop = false,
  ...options
}: UseDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  
  // Search state
  const [internalSearch, setInternalSearch] = useState(initialSearch);
  const search = controlledSearch ?? internalSearch;
  const setSearch = controlledOnSearchChange ?? setInternalSearch;

  // Pagination state
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    initialPagination ?? { pageIndex: 0, pageSize: initialPageSize }
  );
  const pagination = controlledPagination ?? internalPagination;
  const onPaginationChange =
    controlledOnPaginationChange ?? setInternalPagination;

  // Backward compatibility dataState
  const [dataState, setDataState] = useState<TData[]>(data);

  // Tanstack Table instance
  const tableOptions: TableOptions<TData> = {
    data,
    columns,
    getRowId: getRowId as any,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
    ...(manualFiltering ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination,
    manualSorting,
    manualFiltering,
    ...(manualPagination && pageCount !== undefined ? { pageCount } : {}),
    state: {
      rowSelection,
      columnVisibility,
      columnFilters,
      sorting,
      pagination,
      globalFilter: search,
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange,
    onGlobalFilterChange: setSearch,
    ...options,
  };

  const table = useReactTable(tableOptions);

  // Helper dataIds for dnd
  const dataIds = useMemo<UniqueIdentifier[]>(
    () => (getRowId ? data.map((row, i) => getRowId(row, i)) : []),
    [data, getRowId]
  );

  return {
    table,
    // Search
    search,
    setSearch,
    // Pagination
    pagination,
    setPagination: onPaginationChange,
    // Sorting & Filters
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    // Legacy compatibility fields
    dataState,
    setDataState,
    dataIds,
  };
}