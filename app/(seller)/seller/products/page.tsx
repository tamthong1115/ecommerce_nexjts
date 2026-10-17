'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import { fetchApi } from '@/lib/client-fetch';
import { toast } from 'sonner';
import { SellerProductListItem } from '@/types/product.data-types';
import { TableCellViewerSellerProduct } from './_components/table-cell-viewer-seller-product';
import { useDataTable } from '@/hooks/use-data-table';
import {
  createDragColumn,
  createSelectColumn,
} from '@/features/shared/components/table/table-columns';
import {
  DataTablePage,
  TabConfig,
} from '@/features/shared/components/table/data-table-page';

export default function SellerProductsDashboard() {
  const [products, setProducts] = useState<SellerProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi<SellerProductListItem[]>('/api/seller/products');
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
    createDragColumn<SellerProductListItem>((row) => row.id),
    createSelectColumn<SellerProductListItem>(),
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div className="w-14 h-14 relative rounded-md overflow-hidden border border-muted/50 bg-muted shrink-0">
          {row.original.images?.[0]?.url ? (
            <Image
              src={row.original.images[0].url}
              alt={row.original.images[0].alt || row.original.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
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
            <AvatarImage src={row.original.shop?.logoUrl || ''} />
            <AvatarFallback>{row.original.shop?.name?.[0] || 'S'}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.shop?.name}</span>
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
        <div className="text-sm font-medium">
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
              <IconDotsVertical className="size-4" />
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
            <DropdownMenuItem
              onClick={() => router.push(`/products/${row.original.id}`)}
            >
              View Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const { table } = useDataTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
    initialPageSize: 10,
  });

  const handleReorder = (activeId: string | number, overId: string | number) => {
    setProducts((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId);
      const newIndex = prev.findIndex((item) => item.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  };

  const tabs: TabConfig<SellerProductListItem>[] = [
    {
      value: 'all-status',
      label: 'All',
      filterFn: (data) => data,
    },
    {
      value: 'published',
      label: 'Published',
      filterFn: (data) => data.filter((p) => p.status === 'PUBLISHED'),
    },
    {
      value: 'draft',
      label: 'Draft',
      filterFn: (data) => data.filter((p) => p.status === 'DRAFT'),
    },
    {
      value: 'archived',
      label: 'Archived',
      filterFn: (data) => data.filter((p) => p.status === 'ARCHIVED'),
    },
  ];

  return (
    <DataTablePage
      title="My Products"
      table={table}
      loading={loading}
      error={error}
      search="Search products..."
      tabs={tabs}
      actions={
        <Button onClick={() => router.push('/seller/products/create')}>
          Create Product
        </Button>
      }
      reorder={{ onReorder: handleReorder }}
      exportExcel={{
        filename: 'danh-sach-san-pham.xlsx',
        sheetName: 'Sản phẩm',
      }}
      emptyMessage="No products found. Create your first product!"
    />
  );
}
