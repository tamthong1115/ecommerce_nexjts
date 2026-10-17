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
import { VoucherDataTablePagination } from '@/features/voucher/components/voucher-pagination';
import { VoucherResponseDTO } from '@/features/voucher/types/voucher.dto';
import { ExportExcelButton } from '@/features/shared/components/table/export-excel-button';

interface DataTableProps<TData extends VoucherResponseDTO, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

export function DataTable<TData extends VoucherResponseDTO, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const VoucherTable = useReactTable({
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
          table={VoucherTable}
          filename="danh-sach-voucher.xlsx"
          sheetName="Vouchers"
        />
      </div>
      <div className="overflow-hidden px-4 py-2">
        <Table>
          <TableHeader>
            {VoucherTable.getHeaderGroups().map((headerGroup) => (
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
            {VoucherTable.getRowModel().rows?.length ? (
              VoucherTable.getRowModel().rows.map((row) => (
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

      <VoucherDataTablePagination table={VoucherTable} />
    </>
  );
}
