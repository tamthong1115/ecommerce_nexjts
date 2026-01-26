# Table Architecture Review

## Summary
The current table architecture is **well-structured and modular** for client-side data handling. It successfully integrates `TanStack Table` with `dnd-kit` to provide a rich user experience (sorting, filtering, drag-and-drop) with minimal boilerplate in the consuming pages.

However, there are opportunities to improve scalability (server-side data) and user experience (URL synchronization).

## Strengths
- **Separation of Concerns**: The rendering logic (`SortableTable`) is decoupled from the state management (`useDataTable`).
- **Modularity**: Helper components like `DraggableTableRow` and `createDragColumn` make it easy to opt-in to features.
- **Type Safety**: The use of Generics (`TData`) ensures type safety throughout the component tree.
- **Clean API**: The `DataTablePage` wrapper provides a consistent "admin page" layout with minimal code.

## Areas for Improvement

### 1. Server-Side Pagination & Sorting (Critical for Scale)
**Current State**: The hook `useDataTable` assumes all data is loaded into memory (`data` prop) and performs sorting/pagination on the client.
**Issue**: This will cause performance issues if datasets grow large (e.g., thousands of orders or products).
**Recommendation**:
- Add `pageCount` and `manualPagination` options to `useDataTable`.
- Allow passing a callback for state changes (e.g., `onPaginationChange`) to trigger API refetches.

### 2. URL State Synchronization
**Current State**: Table state (search, sort, page) is kept in React state (`useState`).
**Issue**: Reloading the page resets the view. Users cannot share links to specific pages or search results.
**Recommendation**:
- Sync pagination, sorting, and search state with URL Search Params (e.g., `?page=2&sort=name.desc&q=shoe`).

### 3. Decoupling Drag-and-Drop
**Current State**: `SortableTable` *always* wraps the table in `DndContext`, even if D&D is disabled.
**Issue**: This adds unnecessary listeners and overhead for read-only tables.
**Recommendation**:
- Split `SortableTable` into a lightweight `BaseTable` (rendering only) and a wrapper `SortableTable` (adding D&D context).
- Or, make `DndContext` conditional within the component.

### 4. Data State Duplication
**Current State**: `useDataTable` maintains `dataState` which duplicates `data`.
**Issue**: While necessary for optimistic D&D updates, it complicates state synchronization (handled via `useEffect` currently).
**Recommendation**: This is acceptable for now but requires careful handling if `data` updates frequently from the server (e.g., real-time updates).

## Conclusion
The architecture is **excellent for its current purpose** (managing moderate lists like "My Shops"). If you plan to build high-volume data views (e.g., "All System Orders"), prioritizing **Server-Side Support** and **URL Sync** would be the next best steps.
