'use client';
import {
  DragEndEvent,
  SensorDescriptor,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';
import React, { Dispatch, SetStateAction } from 'react';
import { SortableTable } from '@/features/shared/components/table/sortable-table';

type SellerShopListItem = {
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

interface TabShopSellerProps {
  statusFilter: string;
  sensors: SensorDescriptor<any>[];
  sortableId: string;
  table: TanstackTable<SellerShopListItem>;
  columns: ColumnDef<SellerShopListItem>[];
  shopList: SellerShopListItem[];
  setShopList: Dispatch<SetStateAction<SellerShopListItem[]>>;
  dataIds: UniqueIdentifier[];
  DraggableRow: React.ComponentType<{ row: Row<SellerShopListItem> }>;
  handleDragEnd: (event: DragEndEvent) => void;
  loading: boolean;
}

const TabShopSeller = ({
  sensors,
  sortableId,
  table,
  columns,
  shopList,
  dataIds,
  DraggableRow,
  handleDragEnd,
  loading,
}: TabShopSellerProps) => {
  return (
    <SortableTable
      loading={loading}
      data={shopList}
      dataIds={dataIds}
      table={table}
      columns={columns}
      DraggableRow={DraggableRow}
      handleDragEnd={handleDragEnd}
      sensors={sensors}
      sortableId={sortableId}
      emptyMessage="No shops found. Create your first shop!"
    />
  );
};

export default TabShopSeller;
