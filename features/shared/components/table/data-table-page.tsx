'use client';

import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconChevronDown, IconLayoutColumns } from '@tabler/icons-react';
import { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { SensorDescriptor, UniqueIdentifier } from '@dnd-kit/core';
import { SortableTable } from '@/features/shared/components/table/sortable-table';
import { DraggableTableRow } from '@/features/shared/components/table/draggable-table-row';

export interface TabConfig<TData> {
  value: string;
  label: string;
  filterFn?: (data: TData[]) => TData[];
}

export interface DataTablePageProps<TData> {
  title: string;
  data: TData[];
  loading?: boolean;
  error?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  table: TanstackTable<TData>;
  columns: ColumnDef<TData>[];
  tabs?: TabConfig<TData>[];
  defaultTab?: string;
  headerActions?: ReactNode;
  enableDragAndDrop?: boolean;
  dataIds?: UniqueIdentifier[];
  sensors?: SensorDescriptor<any>[];
  handleDragEnd?: (event: any) => void;
  sortableId?: string;
  emptyMessage?: string;
}

export function DataTablePage<TData>({
  title,
  data,
  loading = false,
  error = null,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  table,
  columns,
  tabs = [],
  defaultTab,
  headerActions,
  enableDragAndDrop = false,
  dataIds = [],
  sensors = [],
  handleDragEnd = () => {},
  sortableId = 'data-table',
  emptyMessage = 'No results found.',
}: DataTablePageProps<TData>) {
  const hasTabs = tabs.length > 0;

  const renderTable = (filteredData: TData[]) => (
    <SortableTable
      loading={loading}
      data={filteredData}
      dataIds={dataIds}
      table={table}
      columns={columns}
      DraggableRow={(props) => (
        <DraggableTableRow {...props} enableDragAndDrop={enableDragAndDrop} />
      )}
      handleDragEnd={handleDragEnd}
      sensors={sensors}
      sortableId={sortableId}
      emptyMessage={emptyMessage}
    />
  );

  const columnToggle = (
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
  );

  if (!hasTabs) {
    return (
      <div className="w-full h-full p-3 flex flex-col justify-start items-center">
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between px-4 lg:px-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex gap-2">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-56"
              />
              {headerActions}
            </div>
          </div>

          <div className="flex items-center justify-end px-4 lg:px-6">
            {columnToggle}
          </div>

          {error && (
            <div className="mx-4 p-4 rounded border bg-red-50 text-red-600">
              {error}
            </div>
          )}

          <div className="px-4 lg:px-6">{renderTable(data)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-3 flex flex-col justify-start items-center">
      <Tabs
        defaultValue={defaultTab || tabs[0]?.value}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-56"
            />
            {headerActions}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 lg:px-6">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {columnToggle}
        </div>

        {error && (
          <div className="mx-4 p-4 rounded border bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
          >
            {renderTable(tab.filterFn ? tab.filterFn(data) : data)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
