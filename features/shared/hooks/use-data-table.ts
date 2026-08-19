import { ColumnDef, ColumnFiltersState, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table"
import { useState } from "react"

interface UseDataTableProps<TData, TValue> {
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    getRowId?: (originalRow: TData, index: number, parent?: any) => string
    enableRowSelection?: boolean | ((row: any) => boolean)
}

export function useDataTable<TData, TValue>({
    data,
    columns,
    ...options
}: UseDataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: {
            rowSelection,
            columnVisibility,
            columnFilters,
            sorting,
        },
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        ...options
    })

    return { table }
}