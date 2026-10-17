'use client';

import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconChevronDown,
  IconDownload,
  IconLayoutColumns,
  IconLoader2,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { SensorDescriptor, UniqueIdentifier } from '@dnd-kit/core';
import { SortableTable, ReorderConfig } from '@/features/shared/components/table/sortable-table';
import { DraggableTableRow } from '@/features/shared/components/table/draggable-table-row';
import { exportTableToExcel } from '@/features/shared/utils/export-table-to-excel';
import type { TableController } from '@/features/shared/hooks/use-table-controller';

export interface TabConfig<TData> {
  value: string;
  label: string;
  filterFn?: (data: TData[]) => TData[];
}

export interface TabsConfig<TData> {
  items: TabConfig<TData>[];
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export interface SearchConfig {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export interface ExportExcelConfig {
  enabled?: boolean;
  filename?: string;
  sheetName?: string;
  onExport?: () => Promise<void> | void;
}

export interface DataTableOptions {
  hideToolbar?: boolean;
  hideColumnToggle?: boolean;
  hideSearch?: boolean;
  className?: string;
}

export interface DataTablePageProps<TData> {
  title: string;
  controller?: TableController<TData>;
  table?: TanstackTable<TData>;

  loading?: boolean;
  error?: string | null;
  emptyMessage?: ReactNode;
  actions?: ReactNode;

  search?: string | SearchConfig;
  tabs?: TabConfig<TData>[] | TabsConfig<TData>;
  reorder?: ReorderConfig;
  exportExcel?: boolean | ExportExcelConfig;
  bulkActions?: (selectedRows: TData[], table: TanstackTable<TData>) => ReactNode;
  totalRows?: number;

  options?: DataTableOptions;

  data?: TData[];
  columns?: ColumnDef<TData>[];
  headerActions?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  defaultTab?: string;
  enableDragAndDrop?: boolean;
  dataIds?: UniqueIdentifier[];
  sensors?: SensorDescriptor<any>[];
  handleDragEnd?: (event: any) => void;
  sortableId?: string;
  enableExportExcel?: boolean;
  exportFilename?: string;
  onExportExcel?: () => Promise<void> | void;
}

export function DataTablePage<TData>({
  title,
  controller,
  table: propTable,
  loading: propLoading = false,
  error: propError = null,
  emptyMessage = 'No results found.',
  actions,
  search: propSearch,
  tabs: propTabs = [],
  reorder,
  exportExcel,
  bulkActions,
  totalRows: propTotalRows,
  options = {},

  data: legacyData,
  columns: legacyColumns,
  headerActions,
  searchValue: legacySearchValue,
  onSearchChange: legacyOnSearchChange,
  searchPlaceholder: legacySearchPlaceholder,
  defaultTab: legacyDefaultTab,
  enableDragAndDrop: legacyEnableDragAndDrop,
  dataIds,
  sensors,
  handleDragEnd,
  sortableId,
  enableExportExcel: legacyEnableExportExcel,
  exportFilename: legacyExportFilename,
  onExportExcel: legacyOnExportExcel,
}: DataTablePageProps<TData>) {
  const table = controller?.table ?? propTable!;
  const loading = controller ? controller.loading : propLoading;
  const error = controller ? controller.error : propError;
  const totalRows = controller?.totalRows ?? propTotalRows;
  const search = controller ? controller.bind.search : propSearch;

  const [isExporting, setIsExporting] = useState(false);
  const headerActionsNode = actions ?? headerActions;

  const resolvedSearchConfig = useMemo<SearchConfig>(() => {
    if (typeof search === 'string') {
      return {
        placeholder: search,
        value: (table.getState().globalFilter as string) ?? '',
        onChange: (val) => table.setGlobalFilter(val),
        debounceMs: 300,
      };
    }
    if (search && typeof search === 'object') {
      const s = search as SearchConfig;
      return {
        value: s.value ?? ((table.getState().globalFilter as string) ?? ''),
        onChange: s.onChange ?? ((val) => table.setGlobalFilter(val)),
        placeholder: s.placeholder ?? 'Search...',
        className: s.className,
        debounceMs: s.debounceMs ?? 300,
      };
    }
    return {
      value: legacySearchValue ?? ((table.getState().globalFilter as string) ?? ''),
      onChange: legacyOnSearchChange ?? ((val) => table.setGlobalFilter(val)),
      placeholder: legacySearchPlaceholder ?? 'Search...',
      debounceMs: 300,
    };
  }, [search, table, legacySearchValue, legacyOnSearchChange, legacySearchPlaceholder]);

  const [localSearchInput, setLocalSearchInput] = useState(resolvedSearchConfig.value || '');

  useEffect(() => {
    setLocalSearchInput(resolvedSearchConfig.value || '');
  }, [resolvedSearchConfig.value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearchInput !== (resolvedSearchConfig.value || '')) {
        resolvedSearchConfig.onChange?.(localSearchInput);
      }
    }, resolvedSearchConfig.debounceMs ?? 300);

    return () => clearTimeout(handler);
  }, [localSearchInput, resolvedSearchConfig]);

  const resolvedTabs = useMemo<TabsConfig<TData>>(() => {
    if (Array.isArray(propTabs)) {
      return {
        items: propTabs,
        defaultValue: legacyDefaultTab || propTabs[0]?.value,
      };
    }
    if (propTabs && typeof propTabs === 'object') {
      return {
        items: propTabs.items || [],
        defaultValue: propTabs.defaultValue || propTabs.items[0]?.value,
        value: propTabs.value,
        onChange: propTabs.onChange,
      };
    }
    return { items: [] };
  }, [propTabs, legacyDefaultTab]);

  const hasTabs = resolvedTabs.items.length > 0;
  const [internalTab, setInternalTab] = useState<string>(
    resolvedTabs.defaultValue || resolvedTabs.items[0]?.value || ''
  );
  const activeTab = resolvedTabs.value ?? internalTab;

  const handleTabChange = (nextTab: string) => {
    setInternalTab(nextTab);
    resolvedTabs.onChange?.(nextTab);
  };

  const baseData = legacyData ?? (table.options.data as TData[]);
  const activeTabItem = resolvedTabs.items.find((t) => t.value === activeTab);
  const displayedData = activeTabItem?.filterFn ? activeTabItem.filterFn(baseData) : baseData;

  const resolvedReorder = useMemo<ReorderConfig | undefined>(() => {
    if (reorder) return reorder;
    if (legacyEnableDragAndDrop) {
      return {
        enabled: true,
        onReorder: undefined,
      };
    }
    return undefined;
  }, [reorder, legacyEnableDragAndDrop]);

  const resolvedExportExcel = useMemo<ExportExcelConfig | null>(() => {
    if (exportExcel === false) {
      return null;
    }
    if (typeof exportExcel === 'object') {
      return { enabled: true, ...exportExcel };
    }
    if (legacyEnableExportExcel) {
      return {
        enabled: true,
        filename: legacyExportFilename,
        onExport: legacyOnExportExcel,
      };
    }
    return { enabled: true };
  }, [exportExcel, legacyEnableExportExcel, legacyExportFilename, legacyOnExportExcel]);

  const handleExport = async () => {
    if (resolvedExportExcel?.onExport) {
      await resolvedExportExcel.onExport();
      return;
    }
    try {
      setIsExporting(true);
      await exportTableToExcel(table, {
        filename:
          resolvedExportExcel?.filename ||
          `${title.toLowerCase().replace(/\s+/g, '-')}-export.xlsx`,
        sheetName: resolvedExportExcel?.sheetName || 'Data',
      });
    } catch (err: any) {
      console.error('Failed to export excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const excelExportBtn = resolvedExportExcel?.enabled ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || loading}
      className="flex items-center gap-1.5"
    >
      {isExporting ? (
        <IconLoader2 className="animate-spin size-4" />
      ) : (
        <IconDownload className="size-4" />
      )}
      <span className="hidden sm:inline">Export Excel</span>
    </Button>
  ) : null;

  const columnToggle = !options.hideColumnToggle ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconLayoutColumns />
          <span className="hidden lg:inline">Columns</span>
          <IconChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const selectedRowObjects = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const selectedCount = selectedRowObjects.length;

  return (
    <div
      className={`w-full h-full p-3 flex flex-col justify-start items-center ${
        options.className || ''
      }`}
    >
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center gap-2">
            {!options.hideSearch && (
              <div className="relative flex items-center">
                <IconSearch className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={resolvedSearchConfig.placeholder}
                  value={localSearchInput}
                  onChange={(e) => setLocalSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      resolvedSearchConfig.onChange?.(localSearchInput);
                    }
                  }}
                  className={`pl-8 pr-8 w-56 lg:w-64 ${resolvedSearchConfig.className || ''}`}
                />
                {localSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearchInput('');
                      resolvedSearchConfig.onChange?.('');
                    }}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <IconX className="size-4" />
                  </button>
                )}
              </div>
            )}
            {headerActionsNode}
          </div>
        </div>

        {error && (
          <div className="mx-4 lg:px-6 p-4 rounded-lg border bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {selectedCount > 0 && bulkActions && (
          <div className="mx-4 lg:mx-6 p-2.5 px-4 bg-muted/80 backdrop-blur border rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full font-bold">
                {selectedCount}
              </span>
              <span>đã chọn</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => table.resetRowSelection()}
              >
                Bỏ chọn
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions(selectedRowObjects, table)}
            </div>
          </div>
        )}

        {hasTabs ? (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full flex-col justify-start"
          >
            <div className="flex items-center justify-between px-4 lg:px-6 mb-2">
              <TabsList>
                {resolvedTabs.items.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2">
                {excelExportBtn}
                {columnToggle}
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-end gap-2 px-4 lg:px-6">
            {excelExportBtn}
            {columnToggle}
          </div>
        )}

        <div className="px-4 lg:px-6">
          <SortableTable
            loading={loading}
            data={displayedData}
            columns={legacyColumns}
            table={table}
            totalRows={totalRows}
            reorder={resolvedReorder}
            emptyMessage={emptyMessage}
            dataIds={dataIds}
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            sortableId={sortableId}
            DraggableRow={(props) => (
              <DraggableTableRow
                {...props}
                enableDragAndDrop={
                  resolvedReorder?.enabled !== false && !!resolvedReorder
                }
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
