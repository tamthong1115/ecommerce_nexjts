# Shared Table Components Documentation

This directory contains a set of reusable components for building powerful, sortable, and filterable data tables using [TanStack Table](https://tanstack.com/table/v8) and [dnd-kit](https://dndkit.com/).

## Overview

The core components are designed to work together to provide a consistent UI/UX for data lists.

- **`DataTablePage`**: The top-level wrapper. It handles the page layout, including the title, search bar, tabs, column visibility toggle, and the table itself.
- **`SortableTable`**: The "dumb" table component that renders the data. It wraps the table in a `DndContext` to enable drag-and-drop reordering.
- **`DraggableTableRow`**: A custom row component that integrates with `dnd-kit`'s `useSortable` hook.
- **`table-columns.tsx`**: Helper functions to create common columns like the drag handle and selection checkbox.

## Components

### `DataTablePage`

Located in: `features/shared/components/table/data-table-page.tsx`

This is the main entry point for most list pages.

**Props:**

- `title`: Page title.
- `data`: Array of data items.
- `columns`: TanStack Table column definitions.
- `table`: The TanStack Table instance (returned from `useDataTable` or `useReactTable`).
- `loading`: Boolean to show a loading state.
- `error`: Error message string (optional).
- `searchValue`: Current search string.
- `onSearchChange`: Callback when search changes.
- `tabs`: Array of `TabConfig` objects for filtering (optional).
- `headerActions`: React node for buttons/actions in the header (e.g., "Create" button).
- `enableDragAndDrop`: Boolean to enable `dnd-kit` integration.
- `dataIds`: Array of unique identifiers for `dnd-kit` (required if D&D is enabled).
- `sensors`, `handleDragEnd`: `dnd-kit` props (usually from `useDataTable` hook).

### `SortableTable`

Located in: `features/shared/components/table/sortable-table.tsx`

Renders the actual `<table>` element. It handles:

- Column headers.
- Loading states.
- Empty states.
- Pagination controls.
- Selection summary ("X of Y rows selected").
- Drag-and-drop context.

### `DraggableTableRow` & `DragHandle`

Located in: `features/shared/components/table/draggable-table-row.tsx`

- **`DraggableTableRow`**: Replaces the standard `TableRow`. It applies the necessary CSS transforms and transitions for dragging.
- **`DragHandle`**: A ready-to-use button component containing the grip icon. Use this in your column definitions via `createDragColumn`.

### `DrawerDetailsViewer`

Located in: `features/shared/components/table/drawer-details-viewer.tsx`

A helper component to show details in a side drawer (or bottom sheet on mobile). Useful for "Quick View" functionality without leaving the table.

## Helper Functions

### `createDragColumn`

Located in: `features/shared/components/table/table-columns.tsx`

Creates a column definition for the drag handle.

```tsx
import { createDragColumn } from '@/features/shared/components/table/table-columns';

// In your columns definition:
createDragColumn<MyType>((row) => row.id),
```

### `createSelectColumn`

Located in: `features/shared/components/table/table-columns.tsx`

Creates a column definition for row selection checkboxes (includes "select all" in header).

```tsx
import { createSelectColumn } from '@/features/shared/components/table/table-columns';

// In your columns definition:
createSelectColumn<MyType>(),
```

## Usage Example

Here is a simplified example of how to construct a page using these components.

```tsx
'use client';

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTablePage } from '@/features/shared/components/table/data-table-page';
import { createDragColumn, createSelectColumn } from '@/features/shared/components/table/table-columns';

// 1. Define your data type
type Item = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export default function MyListPage() {
  const [data, setData] = useState<Item[]>(/* ... */);

  // 2. Define columns
  const columns: ColumnDef<Item>[] = [
    createDragColumn<Item>((row) => row.id), // Optional: for drag & drop
    createSelectColumn<Item>(),              // Optional: for selection
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ];

  // 3. Use the hook (assumed to exist in project)
  const {
      table,
      setSearch,
      search,
      dataIds,
      sensors,
      handleDragEnd
  } = useDataTable({
    data,
    columns,
    enableDragAndDrop: true,
    getRowId: (row) => row.id,
  });

  return (
    <DataTablePage
      title="Items"
      data={data}
      table={table}
      columns={columns}
      searchValue={search}
      onSearchChange={setSearch}
      enableDragAndDrop={true}
      dataIds={dataIds}
      sensors={sensors}
      handleDragEnd={handleDragEnd}
    />
  );
}
```
