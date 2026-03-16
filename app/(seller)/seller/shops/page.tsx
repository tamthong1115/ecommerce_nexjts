'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import { TableCellViewerSeller } from './_components/table-cell-viewer-seller';
import { useDataTable } from '@/hooks/use-data-table';
import { paths } from '@/lib/path';
import { fetchApi } from '@/lib/client-fetch';
import { toast } from 'sonner';
import {
  createDragColumn,
  createSelectColumn,
} from '@/features/shared/components/table/table-columns';
import {
  DataTablePage,
  TabConfig,
} from '@/features/shared/components/table/data-table-page';

export type SellerShopListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  status: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function SellerShopsDashboard() {
  const [shops, setShops] = useState<SellerShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch shops data
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi(paths.seller.shops.api.fetch_all);
        if (!res.success) {
          toast.error(res.message || 'Failed to fetch shops');
        }
        const data = (res.data as SellerShopListItem[]) ?? [];
        if (active) {
          setShops(data);
          setLoading(false);
        }
      } catch (e: any) {
        if (active) {
          setError(e.message || 'Error');
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Define columns
  const columns: ColumnDef<SellerShopListItem>[] = [
    createDragColumn<SellerShopListItem>((row) => row.id),
    createSelectColumn<SellerShopListItem>(),
    {
      accessorKey: 'logo',
      header: 'Logo',
      cell: ({ row }) => (
        <Avatar>
          <AvatarImage
            src={row.original.logoUrl || ''}
            alt={row.original.name}
          />
          <AvatarFallback>{row.original.name[0]}</AvatarFallback>
        </Avatar>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Shop Name',
      cell: ({ row }) => <TableCellViewerSeller item={row.original} />,
      enableHiding: false,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'contactEmail',
      header: 'Contact Email',
      cell: ({ row }) => row.original.contactEmail || '—',
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">
            {row.original.ratingAvg.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({row.original.ratingCount})
          </span>
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
                router.push(paths.seller.shops.edit(row.original.id))
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(paths.seller.shops.message_shop(row.original.id))
              }
            >
              Messages
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(paths.seller.shops.members(row.original.id))
              }
            >
              Members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Use data table hook
  const {
    table,
    dataState,
    setDataState,
    search,
    setSearch,
    dataIds,
    sensors,
    handleDragEnd,
  } = useDataTable({
    data: shops,
    columns,
    enableDragAndDrop: true,
    getRowId: (row) => row.id,
    initialPageSize: 10,
  });

  // Sync shops state with data table
  React.useEffect(() => {
    setDataState(shops);
  }, [shops, setDataState]);

  // Define tabs
  const tabs: TabConfig<SellerShopListItem>[] = [
    {
      value: 'all-status',
      label: 'All',
      filterFn: (data) => data,
    },
    {
      value: 'active',
      label: 'Active',
      filterFn: (data) => data.filter((s) => s.status === 'ACTIVE'),
    },
    {
      value: 'pending',
      label: 'Pending',
      filterFn: (data) => data.filter((s) => s.status === 'PENDING'),
    },
  ];

  const sortableId = React.useId();

  return (
    <DataTablePage
      title="My Shops"
      data={shops}
      loading={loading}
      error={error}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search shops..."
      table={table}
      columns={columns}
      tabs={tabs}
      defaultTab="all-status"
      headerActions={
        <Button onClick={() => router.push(paths.seller.shops.create)}>
          Create Shop
        </Button>
      }
      enableDragAndDrop={true}
      dataIds={dataIds}
      sensors={sensors}
      handleDragEnd={handleDragEnd}
      sortableId={sortableId}
      emptyMessage="No shops found. Create your first shop!"
    />
  );
}
