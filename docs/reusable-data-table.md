# Reusable Data Table System

This guide explains how to use the reusable data table components and hooks in your application.

## Overview

The data table system consists of:

- **`useDataTable` hook** - Manages table state, sorting, filtering, pagination, and drag-and-drop
- **`DataTablePage` component** - Complete page layout with tabs, search, and column toggles
- **`DraggableTableRow` component** - Draggable table rows for reordering
- **Helper functions** - `createDragColumn()` and `createSelectColumn()` for common columns

## Quick Start

### 1. Basic Example (No Drag and Drop)

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTablePage } from '@/components/custom/data-table-page';
import { useDataTable } from '@/hooks/use-data-table';
import { createSelectColumn } from '@/lib/table-columns';

type Product = {
  id: string;
  name: string;
  price: number;
  status: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch your data
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const columns: ColumnDef<Product>[] = [
    createSelectColumn<Product>(),
    {
      accessorKey: 'name',
      header: 'Product Name',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ];

  const { table, search, setSearch } = useDataTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <DataTablePage
      title="Products"
      data={products}
      loading={loading}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search products..."
      table={table}
      columns={columns}
    />
  );
}
```

### 2. With Tabs and Filtering

```tsx
import { TabConfig } from '@/components/custom/data-table-page';

// ... (same setup as above)

const tabs: TabConfig<Product>[] = [
  {
    value: 'all',
    label: 'All',
    filterFn: (data) => data,
  },
  {
    value: 'active',
    label: 'Active',
    filterFn: (data) => data.filter((p) => p.status === 'ACTIVE'),
  },
  {
    value: 'inactive',
    label: 'Inactive',
    filterFn: (data) => data.filter((p) => p.status === 'INACTIVE'),
  },
];

return (
  <DataTablePage
    title="Products"
    data={products}
    loading={loading}
    searchValue={search}
    onSearchChange={setSearch}
    table={table}
    columns={columns}
    tabs={tabs}
    defaultTab="all"
  />
);
```

### 3. With Drag and Drop

```tsx
import { createDragColumn, createSelectColumn } from '@/lib/table-columns';

const columns: ColumnDef<Product>[] = [
  createDragColumn<Product>((row) => row.id),
  createSelectColumn<Product>(),
  // ... other columns
];

const { table, search, setSearch, dataIds, sensors, handleDragEnd } =
  useDataTable({
    data: products,
    columns,
    enableDragAndDrop: true,
    getRowId: (row) => row.id,
  });

const sortableId = React.useId();

return (
  <DataTablePage
    title="Products"
    data={products}
    loading={loading}
    searchValue={search}
    onSearchChange={setSearch}
    table={table}
    columns={columns}
    enableDragAndDrop={true}
    dataIds={dataIds}
    sensors={sensors}
    handleDragEnd={handleDragEnd}
    sortableId={sortableId}
  />
);
```

### 4. With Header Actions

```tsx
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const router = useRouter();

return (
  <DataTablePage
    title="Products"
    data={products}
    loading={loading}
    searchValue={search}
    onSearchChange={setSearch}
    table={table}
    columns={columns}
    headerActions={
      <>
        <Button variant="outline" onClick={() => console.log('Export')}>
          Export
        </Button>
        <Button onClick={() => router.push('/products/create')}>
          Create Product
        </Button>
      </>
    }
  />
);
```

## API Reference

### `useDataTable<TData>(options)`

A custom hook that manages all table state.

**Options:**

- `data: TData[]` - Your data array
- `columns: ColumnDef<TData>[]` - Column definitions
- `enableDragAndDrop?: boolean` - Enable drag and drop (default: false)
- `getRowId?: (row: TData) => string` - Function to get unique row ID
- `initialPageSize?: number` - Initial page size (default: 10)

**Returns:**

- `table` - TanStack Table instance
- `dataState` - Current data state
- `setDataState` - Update data state
- `search` - Search value
- `setSearch` - Update search value
- `dataIds` - Array of row IDs (for drag and drop)
- `sensors` - Drag and drop sensors
- `handleDragEnd` - Drag end handler

### `DataTablePage<TData>` Component

**Props:**

- `title: string` - Page title
- `data: TData[]` - Data array
- `loading?: boolean` - Show loading state
- `error?: string | null` - Error message
- `searchValue: string` - Current search value
- `onSearchChange: (value: string) => void` - Search change handler
- `searchPlaceholder?: string` - Search input placeholder
- `table: TanstackTable<TData>` - Table instance
- `columns: ColumnDef<TData>[]` - Column definitions
- `tabs?: TabConfig<TData>[]` - Tab configurations
- `defaultTab?: string` - Default tab value
- `headerActions?: ReactNode` - Actions in header (buttons, etc.)
- `enableDragAndDrop?: boolean` - Enable drag and drop
- `dataIds?: UniqueIdentifier[]` - Row IDs for drag and drop
- `sensors?: SensorDescriptor<any>[]` - Drag sensors
- `handleDragEnd?: (event: any) => void` - Drag end handler
- `sortableId?: string` - Unique ID for sortable context
- `emptyMessage?: string` - Message when no data

### Helper Functions

#### `createDragColumn<TData>(getRowId)`

Creates a drag handle column for drag and drop functionality.

```tsx
createDragColumn<Product>((row) => row.id);
```

#### `createSelectColumn<TData>()`

Creates a checkbox selection column.

```tsx
createSelectColumn<Product>();
```

## Complete Example

See `/app/(seller)/seller/shops/page.tsx` for a complete working example with:

- Data fetching
- Tabs with filtering
- Drag and drop
- Custom columns
- Actions dropdown
- Error handling

## Tips

1. **Always provide `getRowId`** when using drag and drop
2. **Use tabs for filtering** instead of separate components
3. **Keep column definitions in the component** for easy customization
4. **Use the helper functions** for drag and select columns
5. **Sync external data** using `useEffect` when data changes

## Migration Guide

To migrate an existing table to use these components:

1. Replace table state management with `useDataTable` hook
2. Remove manual table creation (`useReactTable`)
3. Replace custom table layout with `DataTablePage`
4. Use `createDragColumn` and `createSelectColumn` helpers
5. Remove manual drag and drop implementation
6. Configure tabs instead of separate components

The result is ~60% less code with the same functionality!
