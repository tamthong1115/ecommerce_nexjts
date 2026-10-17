'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderDTO } from '@/types/dtos/order.dto';
import { OrderDataTablePagination } from '@/app/(seller)/seller/orders/_components/order-table-pagination';
import { ExportExcelButton } from '@/features/shared/components/table/export-excel-button';

interface DataTableProps<TData extends OrderDTO, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

export function DataTable<TData extends OrderDTO, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const OrderTable = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      pagination,
    },
    onPaginationChange: onPaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex items-center justify-end px-4 py-2">
        <ExportExcelButton
          table={OrderTable}
          filename="danh-sach-don-hang.xlsx"
          sheetName="Đơn hàng"
        />
      </div>
      <div className="overflow-hidden px-4 py-2">
        <Table>
          <TableHeader>
            {OrderTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody>
            {OrderTable.getRowModel().rows?.length ? (
              OrderTable.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDataTablePagination table={OrderTable} />
    </>
  );
}
