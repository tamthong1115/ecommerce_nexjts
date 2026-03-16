'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { paths } from '@/lib/path';
import { userDataResponse, userItemData } from '@/types/manager.data-types';
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
import { IconChevronDown, IconLayoutColumns } from '@tabler/icons-react';
import {
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
import SearchBar from '../../../features/manager/_components/search-bar';
import TabTableView from '../../../features/manager/_components/tab-table-view';
import { useUserColumns } from '@/features/manager/users/components/columns';

const UsersPage = () => {
  const [data, setData] = React.useState<userDataResponse | null>(null);
  const [userList, setUserList] = React.useState<userItemData[]>([]);
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

  const t = useTranslations('admin_user_page');
  const n = useTranslations('admin_notification');
  const g = useTranslations('general');
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => userList?.map(({ id }) => id) || [],
    [userList]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setUserList((data) => {
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

  const handleCopy = useCopyToClipboard({ t: n });
  const columns = useUserColumns({
    t: t,
    g: g,
    handleCopy: handleCopy,
    setIsReset: setIsReset,
    n: n,
  });

  const table = useReactTable({
    data: userList,
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

  function DraggableRow({ row }: { row: Row<userItemData> }) {
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

  return (
    <div className="w-full h-full p-3 flex flex-col justify-start items-center">
      <SearchBar
        baseUrl={paths.manager.user.search}
        placeholder={t('t_search_placeholder')}
        setData={setData}
        setIsReset={setIsReset}
        isReset={isReset}
        setIsFalse={setIsFalse}
        keyQueryList={['name', 'id', 'email']}
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
              <SelectItem value="all-un-banned">
                {t('t_tab_un_banned')}
              </SelectItem>
              <SelectItem value="all-banned">{t('t_tab_banned')}</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all-status">{t('t_tab_all')}</TabsTrigger>
            <TabsTrigger value="all-un-banned">
              {t('t_tab_un_banned')}
            </TabsTrigger>
            <TabsTrigger value="all-banned">{t('t_tab_banned')}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:cursor-pointer"
                >
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
                        className="capitalize hover:cursor-pointer"
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
          </div>
        </div>
        <TabsContent
          value="all-status"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabTableView<userItemData>
            filter=""
            baseUrl={paths.manager.user.fetch_all}
            isReset={isReset}
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            data={data}
            setData={setData}
            list={userList}
            setList={setUserList}
            isFalse={isFalse}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
          />
        </TabsContent>
        <TabsContent
          value="all-un-banned"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
            <TabTableView<userItemData>
              filter="false"
              baseUrl={paths.manager.user.fetch_all}
              isReset={isReset}
              sensors={sensors}
              sortableId={sortableId}
              table={table}
              columns={columns}
              data={data}
              setData={setData}
              list={userList}
              setList={setUserList}
              isFalse={isFalse}
              dataIds={dataIds}
              DraggableRow={DraggableRow}
              handleDragEnd={handleDragEnd}
            />
          </div>
        </TabsContent>
        <TabsContent value="all-banned" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
            <TabTableView<userItemData>
              filter="true"
              baseUrl={paths.manager.user.fetch_all}
              isReset={isReset}
              sensors={sensors}
              sortableId={sortableId}
              table={table}
              columns={columns}
              data={data}
              setData={setData}
              list={userList}
              setList={setUserList}
              isFalse={isFalse}
              dataIds={dataIds}
              DraggableRow={DraggableRow}
              handleDragEnd={handleDragEnd}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default UsersPage;
