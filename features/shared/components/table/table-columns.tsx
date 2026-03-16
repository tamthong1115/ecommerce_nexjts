'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { DragHandle } from '@/features/shared/components/table/draggable-table-row';

export function createDragColumn<TData>(
  getRowId: (row: TData) => string
): ColumnDef<TData> {
  return {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={getRowId(row.original)} />,
    enableHiding: false,
    enableSorting: false,
  };
}

export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
