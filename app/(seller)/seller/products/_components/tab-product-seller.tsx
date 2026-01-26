'use client';
import {
  DragEndEvent,
  SensorDescriptor,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';
import React, { Dispatch, SetStateAction } from 'react';
import { SortableTable } from '@/features/shared/components/table/sortable-table';

type SellerProductListItem = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  images: {
    url: string;
    alt?: string | null;
  }[];
};

interface TabProductSellerProps {
  statusFilter: string;
  sensors: SensorDescriptor<any>[];
  sortableId: string;
  table: TanstackTable<SellerProductListItem>;
  columns: ColumnDef<SellerProductListItem>[];
  productList: SellerProductListItem[];
  setProductList: Dispatch<SetStateAction<SellerProductListItem[]>>;
  dataIds: UniqueIdentifier[];
  DraggableRow: React.ComponentType<{ row: Row<SellerProductListItem> }>;
  handleDragEnd: (event: DragEndEvent) => void;
  loading: boolean;
}

const TabProductSeller = ({
  sensors,
  sortableId,
  table,
  columns,
  productList,
  dataIds,
  DraggableRow,
  handleDragEnd,
  loading,
}: TabProductSellerProps) => {
  return (
    <SortableTable
      loading={loading}
      data={productList}
      dataIds={dataIds}
      table={table}
      columns={columns}
      DraggableRow={DraggableRow}
      handleDragEnd={handleDragEnd}
      sensors={sensors}
      sortableId={sortableId}
      emptyMessage="No products found. Create your first product!"
    />
  );
};

export default TabProductSeller;
