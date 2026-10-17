'use client';

import React, { useMemo, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLoader2,
} from '@tabler/icons-react';
import {
  ColumnDef,
  flexRender,
  Row,
  Table as TanstackTable,
} from '@tanstack/react-table';
import { DraggableTableRow } from './draggable-table-row';
import { cn } from '@/lib/utils';

export interface ReorderConfig {
  enabled?: boolean;
  onReorder?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
}

export interface SortableTableProps<TData> {
  table: TanstackTable<TData>;
  data?: TData[];
  columns?: ColumnDef<TData>[];
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  totalRows?: number;

  // Reorder / Drag and Drop
  reorder?: ReorderConfig;
  onReorder?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  getRowId?: (originalRow: TData) => UniqueIdentifier;

  // Escape hatches / Legacy support
  dataIds?: UniqueIdentifier[];
  sensors?: any[];
  handleDragEnd?: (event: DragEndEvent) => void;
  sortableId?: string;
  DraggableRow?: React.ComponentType<{ row: Row<TData>; enableDragAndDrop?: boolean }>;
}

export function SortableTable<TData>({
  table,
  data: propData,
  columns: propColumns,
  loading = false,
  emptyMessage = 'No results found.',
  totalRows,
  reorder,
  onReorder: legacyOnReorder,
  getRowId,
  dataIds: propDataIds,
  sensors: propSensors,
  handleDragEnd: propHandleDragEnd,
  sortableId: propSortableId,
  DraggableRow: CustomDraggableRow,
}: SortableTableProps<TData>) {
  const generatedId = useId();
  const sortableId = propSortableId || generatedId;

  // Resolve data and columns from table if not explicitly passed
  const data = propData ?? (table.options.data as TData[]);
  const columns = propColumns ?? (table.options.columns as ColumnDef<TData>[]);

  // Resolve reorder callback
  const activeReorderFn = reorder?.onReorder ?? legacyOnReorder;
  const isDndEnabled = reorder?.enabled !== false && !!activeReorderFn;

  const defaultSensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const sensors = propSensors && propSensors.length > 0 ? propSensors : defaultSensors;

  // Resolve dataIds
  const dataIds = useMemo<UniqueIdentifier[]>(() => {
    if (propDataIds && propDataIds.length > 0) return propDataIds;
    if (getRowId) return data.map(getRowId);
    return table.getRowModel().rows.map((row) => (row.original as any)?.id ?? row.id);
  }, [propDataIds, getRowId, data, table]);

  function defaultHandleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id && activeReorderFn) {
      activeReorderFn(active.id, over.id);
    }
  }

  const handleDragEnd = propHandleDragEnd || defaultHandleDragEnd;

  const rowCount = table.getRowModel().rows.length;
  const isInitialLoading = loading && rowCount === 0;
  const isRefetching = loading && rowCount > 0;
  const skeletonRowCount = Math.min(table.getState().pagination?.pageSize || 5, 8);

  const renderTableBodyRows = () => {
    if (isInitialLoading) {
      return Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {columns.map((_, colIndex) => (
            <TableCell key={`skeleton-col-${colIndex}`} className="py-3">
              <Skeleton className="h-5 w-full max-w-[85%]" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (rowCount === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-24 text-center text-muted-foreground"
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      );
    }

    const RowComponent = CustomDraggableRow || DraggableTableRow;

    return (
      <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
        {table.getRowModel().rows.map((row) => (
          <RowComponent
            key={row.id}
            row={row}
            enableDragAndDrop={isDndEnabled}
          />
        ))}
      </SortableContext>
    );
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border">
        {/* Subtle top loading indicator during refetching */}
        {isRefetching && (
          <div className="absolute inset-x-0 top-0 z-20 h-1 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        )}

        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody
              className={cn(
                '**:data-[slot=table-cell]:first:w-8',
                isRefetching && 'opacity-60 transition-opacity pointer-events-none'
              )}
            >
              {renderTableBodyRows()}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4 mt-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0
            ? `${table.getFilteredSelectedRowModel().rows.length} of ${totalRows ?? rowCount} row(s) selected.`
            : `Total ${totalRows ?? rowCount} item(s)`}
          {isRefetching && (
            <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
              <IconLoader2 className="size-3 animate-spin" />
              Updating...
            </span>
          )}
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {Math.max(1, table.getPageCount())}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
