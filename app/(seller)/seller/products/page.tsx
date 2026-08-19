'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { fetchApi } from '@/lib/client-fetch';
import { toast } from 'sonner';
import { SellerProductListItem } from '@/types/product.data-types';
import Image from 'next/image';
import { TableCellViewerSellerProduct } from './_components/table-cell-viewer-seller-product';

export default function SellerProductsDashboard() {
  const [products, setProducts] = useState<SellerProductListItem[]>([]);
  // 1. Add state to track the active tab
  const [activeTab, setActiveTab] = useState('all-status');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();

  // 2. Compute filtered products based on the active tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'all-status') return products;
    if (activeTab === 'published')
      return products.filter((p) => p.status === 'PUBLISHED');
    if (activeTab === 'draft')
      return products.filter((p) => p.status === 'DRAFT');
    if (activeTab === 'archived')
      return products.filter((p) => p.status === 'ARCHIVED');
    return products;
  }, [products, activeTab]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredProducts?.map(({ id }) => id) || [],
    [filteredProducts]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setProducts((data) => {
        // Find indices in the main 'products' array to ensure correct reordering
        // Note: DND filtering adds complexity; this basic logic reorders the filtered view
        // Ideally, you map IDs back to the main array.
        const oldIndex = data.findIndex((item) => item.id === active.id);
        const newIndex = data.findIndex((item) => item.id === over.id);
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi<SellerProductListItem[]>(
          '/api/seller/products'
        );

        if (active) {
          if (res.success && res.data) {
            setProducts(res.data);
          } else {
            const msg = res.message || 'Failed to fetch products';
            toast.error(msg);
            setError(msg);
          }
          setLoading(false);
        }
      } catch (e: any) {
        if (active) {
          console.error(e);
          setError(e.message || 'Error');
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const columns: ColumnDef<SellerProductListItem>[] = [
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
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div className="w-16 h-18 relative rounded overflow-hidden border border-muted/50 bg-muted">
          {row.original.images?.[0]?.url ? (
            <Image
              src={row.original.images[0].url}
              alt={row.original.images[0].alt || row.original.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              No img
            </div>
          )}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: 'Product Name',
      cell: ({ row }) => <TableCellViewerSellerProduct item={row.original} />,
      enableHiding: false,
    },
    {
      accessorKey: 'shop',
      header: 'Shop',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={row.original.shop.logoUrl || ''} />
            <AvatarFallback>{row.original.shop.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.shop.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'PUBLISHED' ? 'default' : 'secondary'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'visibility',
      header: 'Visibility',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.visibility}</Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price Range',
      cell: ({ row }) => (
        <div className="text-sm">
          {Number(row.original.minPrice).toLocaleString()} -{' '}
          {Number(row.original.maxPrice).toLocaleString()}{' '}
          {row.original.currency}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
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
            <DropdownMenuItem
              onClick={() =>
                router.push(`/seller/products/${row.original.id}/edit`)
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // 3. Initialize table with FILTERED products
  const table = useReactTable({
    data: filteredProducts, // <--- Using filteredProducts instead of products
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter: search,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id });

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

  function DraggableRow({ row }: { row: Row<SellerProductListItem> }) {
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
      <Tabs
        value={activeTab} // 4. Bind value to state
        onValueChange={setActiveTab} // 5. Update state on change
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
          <h1 className="text-2xl font-bold">My Products</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Button onClick={() => router.push('/seller/products/create')}>
              Create Product
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 lg:px-6">
          <TabsList>
            <TabsTrigger value="all-status">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Columns</span>
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
        </div>

        {error && (
          <div className="mx-4 p-4 rounded border bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {/* 6. Tabs Content now simply renders the component.
            Since 'filteredProducts' is passed to useReactTable,
            the 'table' instance already contains ONLY the filtered rows. */}

        <TabsContent
          value="all-status"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabProductSeller
            statusFilter=""
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            productList={filteredProducts}
            setProductList={setProducts}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
            loading={loading}
          />
        </TabsContent>

        <TabsContent
          value="published"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabProductSeller
            statusFilter="PUBLISHED"
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            productList={filteredProducts}
            setProductList={setProducts}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
            loading={loading}
          />
        </TabsContent>

        <TabsContent
          value="draft"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabProductSeller
            statusFilter="DRAFT"
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            productList={filteredProducts}
            setProductList={setProducts}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
            loading={loading}
          />
        </TabsContent>

        <TabsContent
          value="archived"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabProductSeller
            statusFilter="ARCHIVED"
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            productList={filteredProducts}
            setProductList={setProducts}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
