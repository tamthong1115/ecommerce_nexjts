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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  IconChevronDown,
  IconDotsVertical,
  IconLayoutColumns,
} from '@tabler/icons-react';
import {
  ColumnDef,
} from '@tanstack/react-table';
import { SellerProductListItem } from '@/types/product.data-types';
import { useSellerProducts } from '@/features/product/hooks/use-products';
import Image from 'next/image';
import { TableCellViewerSellerProduct } from '@/app/(seller)/seller/products/_components/table-cell-viewer-seller-product';
import { DragHandle } from '@/features/shared/components/table/draggable-table-row';
import { DataTablePagination } from '@/features/shared/components/table/data-table-pagination';
import { DataTable } from '@/features/shared/components/table/data-table';
import { useDataTable } from '@/features/shared/hooks/use-data-table';

export default function ProductDashboardSeller() {
  const { data: fetchedProducts, isLoading: loading, error: queryError } = useSellerProducts();
  const [products, setProducts] = useState<SellerProductListItem[]>([]);
  const [activeTab, setActiveTab] = useState('all-status');
  const [search, setSearch] = useState('');
  const error = queryError ? queryError.message : null;

  useEffect(() => {
    if (fetchedProducts) {
      setProducts(fetchedProducts);
    }
  }, [fetchedProducts]);

  const router = useRouter();

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


  function handleReorder(activeId: UniqueIdentifier, overId: UniqueIdentifier) {
    setProducts((data) => {
      const oldIndex = data.findIndex((item) => item.id === activeId);
      const newIndex = data.findIndex((item) => item.id === overId);
      return arrayMove(data, oldIndex, newIndex);
    });
  }


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

  const { table } = useDataTable({
    data: filteredProducts,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true
  });


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
          <DataTable
            table={table}
            columnsLength={columns.length}
            loading={loading}
            getRowId={(row) => row.id}
            onReorder={handleReorder}
          />
          <DataTablePagination table={table} />
        </TabsContent>
        <TabsContent
          value="published"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DataTable
            table={table}
            columnsLength={columns.length}
            loading={loading}
            getRowId={(row) => row.id}
            onReorder={handleReorder}
          />
          <DataTablePagination table={table} />
        </TabsContent>
        <TabsContent
          value="draft"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DataTable
            table={table}
            columnsLength={columns.length}
            loading={loading}
            getRowId={(row) => row.id}
            onReorder={handleReorder}
          />
          <DataTablePagination table={table} />
        </TabsContent>
        <TabsContent
          value="archived"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DataTable
            table={table}
            columnsLength={columns.length}
            loading={loading}
            getRowId={(row) => row.id}
            onReorder={handleReorder}
          />
          <DataTablePagination table={table} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
