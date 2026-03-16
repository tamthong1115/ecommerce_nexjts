'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewCategoryForm } from '@/features/manager/category/components/new-category-form';
import TableCellViewer from '@/features/manager/category/components/table-cell-viewer';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { paths } from '@/lib/path';
import { formatDay, LocaleType } from '@/lib/utils';
import {
  categoryDataResponse,
  categoryItemData,
} from '@/types/manager.data-types';
import {
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconChevronDown,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
} from '@tabler/icons-react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { FiXCircle } from 'react-icons/fi';
import SearchBar from '../../../features/manager/_components/search-bar';
import TabTableView from '../../../features/manager/_components/tab-table-view';
import { handleDelete } from '@/features/manager/category/funcs/funcs';

const CategoryManagePage = () => {
  const [data, setData] = React.useState<categoryDataResponse | null>(null);
  const [categoryList, setCategoryList] = React.useState<categoryItemData[]>(
    []
  );
  const [isReset, setIsReset] = React.useState<boolean>(false);
  const [isFalse, setIsFalse] = React.useState<boolean>(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => categoryList?.map(({ id }) => id) || [],
    [categoryList]
  );
  const t = useTranslations('admin_category_page');
  const n = useTranslations('admin_notification');
  const g = useTranslations('general');
  const handleCopy = useCopyToClipboard({ t: n });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setCategoryList((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const columns: ColumnDef<categoryItemData>[] = React.useMemo(
    () => [
      {
        id: 'drag',
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
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
      },
      {
        accessorKey: t('t_category_name'),
        header: t('t_category_name'),
        cell: ({ row }) => {
          return (
            <TableCellViewer item={row.original} setIsReset={setIsReset} />
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: t('t_serial'),
        header: t('t_serial'),
        cell: ({ row }) => (
          <div className="w-full flex flex-row gap-2 justify-start items-center">
            <div>{row.original.position}</div>
          </div>
        ),
      },
      {
        accessorKey: t('t_is_active'),
        header: t('t_is_active'),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {!row.original.isActive ? (
              <FiXCircle className="fill-red-500 dark:fill-red-400" />
            ) : (
              <FaCheckCircle className="fill-green-500 dark:fill-green-400" />
            )}
            {row.original.isActive ? 'Có' : 'Không'}
          </Badge>
        ),
      },
      {
        accessorKey: t('t_children_count'),
        header: () => (
          <div className="w-fit text-right">{t('t_children_count')}</div>
        ),
        cell: ({ row }) => (
          <div className="w-full text-right">
            {row.original._count.children.toString()}
          </div>
        ),
      },
      {
        accessorKey: t('t_created_at'),
        header: t('t_created_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32">
              {formatDay(row.original.createdAt, g('t_region') as LocaleType)}
            </div>
          );
        },
      },
      {
        accessorKey: t('t_updated_at'),
        header: t('t_updated_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32">
              {formatDay(row.original.updatedAt, g('t_region') as LocaleType)}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem className="flex justify-center items-center">
                <Button
                  variant={'ghost'}
                  className="text-left"
                  onClick={() => handleCopy(row.original.id)}
                >
                  {t('t_copy_action')}
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex justify-center items-center">
                <Button
                  variant={'destructive'}
                  className="text-left w-full"
                  onClick={() =>
                    handleDelete({
                      url: paths.manager.category.del_one(row.original.id),
                      setIsReset: setIsReset,
                      t,
                    })
                  }
                >
                  {t('t_del_action')}
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [g, handleCopy, t]
  );

  const table = useReactTable({
    data: categoryList,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  return (
    <div className="w-full h-full p-3 flex flex-col justify-start items-center">
      <SearchBar
        baseUrl={paths.manager.category.search}
        placeholder={t('t_search_placeholder')}
        setData={setData}
        setIsReset={setIsReset}
        isReset={isReset}
        setIsFalse={setIsFalse}
        keyQueryList={['name', 'id']}
      />
      <Tabs
        defaultValue="all-status"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="all-status">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">{t('t_tab_all')}</SelectItem>
              <SelectItem value="all-active">{t('t_tab_active')}</SelectItem>
              <SelectItem value="all-inactive">
                {t('t_tab_inactive')}
              </SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all-status">{t('t_tab_all')}</TabsTrigger>
            <TabsTrigger value="all-active">{t('t_tab_active')}</TabsTrigger>
            <TabsTrigger value="all-inactive">
              {t('t_tab_inactive')}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">{t('t_showing')}</span>
                  <span className="lg:hidden">{t('t_column')}</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <NewCategoryForm setIsReset={setIsReset} />
          </div>
        </div>
        <TabsContent
          value="all-status"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabTableView<categoryItemData>
            filter=""
            baseUrl={paths.manager.category.fetch_all}
            isReset={isReset}
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            data={data}
            setData={setData}
            list={categoryList}
            setList={setCategoryList}
            isFalse={isFalse}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
          />
        </TabsContent>
        <TabsContent
          value="all-active"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabTableView<categoryItemData>
            filter="true"
            baseUrl={paths.manager.category.fetch_all}
            isReset={isReset}
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            data={data}
            setData={setData}
            list={categoryList}
            setList={setCategoryList}
            isFalse={isFalse}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
          />
        </TabsContent>
        <TabsContent
          value="all-inactive"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabTableView<categoryItemData>
            filter="false"
            baseUrl={paths.manager.category.fetch_all}
            isReset={isReset}
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            data={data}
            setData={setData}
            list={categoryList}
            setList={setCategoryList}
            isFalse={isFalse}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryManagePage;

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableRow({ row }: { row: Row<categoryItemData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
