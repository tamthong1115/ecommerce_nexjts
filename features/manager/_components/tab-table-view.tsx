'use client';

import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { fetchApi } from '@/lib/client-fetch';
import { baseDataResponse } from '@/types/manager.data-types';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
  UniqueIdentifier,
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
} from '@tabler/icons-react';
import {
  ColumnDef,
  flexRender,
  Row,
  Table as TanstackTable,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { IoMdCloseCircle } from 'react-icons/io';
import { toast } from 'sonner';

/**
 * @interface tabProductProps
 * Defines the complete set of props required by the TabProduct component.
 */
interface tabProductProps<T> {
  /** The current filter string (e.g., "PUBLIC", "PRIVATE",...). */
  filter: string;

  /**base url for fetch data */
  baseUrl: string;

  /** Check the reset state: If reset data is called, change reset state */
  isReset: boolean;

  /** Array of sensor descriptors from dnd-kit for enabling drag-and-drop. */
  sensors: SensorDescriptor<SensorOptions>[];

  /** A unique string ID passed to the SortableContext. */
  sortableId: string;

  /** The table instance object returned from `useReactTable`. */
  table: TanstackTable<T>;

  /** The column definitions used to build the table. */
  columns: ColumnDef<T>[];

  /** The complete data object from the API, including pagination. */
  data: baseDataResponse<T> | null;

  /** The React state setter for the `data` object. */
  setData: Dispatch<SetStateAction<baseDataResponse<T> | null>>;

  /** The array of product items currently rendered in the table. */
  list: T[];

  /** The React state setter for the `productList` array. */
  setList: Dispatch<SetStateAction<T[]>>;

  /**Check if no data returns */
  isFalse: boolean;

  /** Memoized array of product IDs for dnd-kit's `SortableContext`. */
  dataIds: UniqueIdentifier[];

  /** The component to be used for rendering each draggable row. */
  DraggableRow: React.ComponentType<{ row: Row<T> }>;

  /** Callback function to handle the `onDragEnd` event from dnd-kit. */
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Renders a tab panel content, displaying a sortable and paginated table
 * of products based on the provided `filter`.
 *
 * @param {tabProductProps} props The destructured props for the component.
 * @returns {React.ReactElement} The rendered tab panel.
 */
const TabTableView = <T,>({
  filter,
  baseUrl,
  isReset,
  sensors,
  sortableId,
  table,
  columns,
  data,
  setData,
  list,
  setList,
  isFalse,
  dataIds,
  DraggableRow,
  handleDragEnd,
}: tabProductProps<T>) => {
  const [rows, setRows] = React.useState<number>(10);
  const t = useTranslations('admin_tab_table_view');
  const n = useTranslations('admin_notification');

  // Helper function to handle fetching
  const loadData = async (page: number, limit: number) => {
    try {
      const res = await fetchApi<T[]>(baseUrl, {
        params: { page, limit, filter },
      });

      if (res.success && res.data) {
        setData({
          data: res.data,
          pagination: res.meta?.pagination || {
            page: 1,
            limit: rows,
            total: 0,
            totalPages: 1,
          },
        });
      } else {
        toast(n('t_action_failed_noti'), {
          description: n('t_copy_success_failed_desc_noti'),
          duration: 3000,
          icon: <IoMdCloseCircle />,
          cancel: {
            label: 'OK',
            onClick: () => {},
          },
        });
        setData({
          data: [],
          pagination: {
            page: 0,
            limit: rows,
            total: 0,
            totalPages: 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load table data:', error);
    }
  };

  useEffect(() => {
    loadData(1, rows);
  }, [baseUrl, filter, isReset, rows]);

  useEffect(() => {
    if (data) {
      console.log(data);
      setList(data.data);
    }
  }, [data, setList]);

  if (!data && isFalse === false) return <Loading />;

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
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
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {list.length !== 0 && isFalse === false ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t('t_no_product_found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} {t('t_of')}{' '}
          {table.getFilteredRowModel().rows.length} {t('t_rows_selected')}
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              {t('t_rows_per_page')}
            </Label>
            <Select
              value={rows.toString()}
              onValueChange={(value) => {
                const newRows = Number(value);
                table.setPageSize(newRows);
                setRows(newRows);
                loadData(1, newRows);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20 hover:cursor-pointer"
                id="rows-per-page"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="hover:cursor-pointer"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* FIX 3: Added Optional Chaining (?.) for safety */}
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {t('t_page')} {data?.pagination?.page || 0} {t('t_of')}{' '}
            {data?.pagination?.totalPages || 0}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex hover:cursor-pointer"
              onClick={() => {
                table.setPageIndex(0);
                loadData(1, rows);
              }}
              disabled={data?.pagination ? data.pagination.page - 1 <= 0 : true}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8 hover:cursor-pointer"
              size="icon"
              onClick={() => {
                table.previousPage();
                const prevPage = data?.pagination
                  ? data.pagination.page - 1
                  : 1;
                loadData(prevPage, rows);
              }}
              disabled={data?.pagination ? data.pagination.page - 1 <= 0 : true}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8 hover:cursor-pointer"
              size="icon"
              onClick={() => {
                table.nextPage();
                const nextPage = data?.pagination
                  ? data.pagination.page + 1
                  : 1;
                loadData(nextPage, rows);
              }}
              disabled={
                data?.pagination
                  ? data.pagination.page + 1 > data.pagination.totalPages
                  : true
              }
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex hover:cursor-pointer"
              size="icon"
              onClick={() => {
                table.setPageIndex(table.getPageCount() - 1);
                const lastPage = data?.pagination
                  ? data.pagination.totalPages
                  : 1;
                loadData(lastPage, rows);
              }}
              disabled={
                data?.pagination
                  ? data.pagination.page + 1 > data.pagination.totalPages
                  : true
              }
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
export default TabTableView;
