import { StatusCode } from '@/types/api';
import { Pagination } from '../_types/types';

export type WarehouseDTO = {
  id: string;
  name: string;
  region: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetWarehouseResult =
  | {
      success: true;
      data: WarehouseDTO[];
      message: string;
      meta: {
        pagination: Pagination;
      };
      code: StatusCode;
    }
  | {
      success: false;
      error: string;
    };

export type WarehouseRequestDTO = {
  name: string;
  location: string;
  size: number;
  storageAreaSize: number;
  slotSize: number;
  region: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateWarehouseResult =
  | {
      success: true;
      data: WarehouseRequestDTO | null;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type WarehouseDetailDTO = {
  id: string;
  name: string;
  location: string;
  size: number;
  storageAreaSize: number;
  slotSize: number;
  region: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetWarehouseDetailResult =
  | {
      success: true;
      data: WarehouseDetailDTO;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type StorageAreaDTO = {
  id: string;
  name: string;
  type: string;
  warehouseId: string;
  status: string;
  SlotSize: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GetStorageAreaResult =
  | {
      success: true;
      data: StorageAreaDTO[];
      message: string;
      meta: {
        pagination: Pagination;
      };
    }
  | {
      success: false;
      error: string;
    };

export type SlotDTO = {
  id: string;
  areaId: string;
  serial: string;
  ownerId: string;
  shopId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetSlotResult =
  | {
      success: true;
      data: SlotDTO[];
      message: string;
      meta: {
        pagination: Pagination;
      };
      code: StatusCode;
    }
  | {
      success: false;
      error: string;
    };

export type OrderSlotDTO = {
  id: string;
  ownerId: string;
  orderId: string;
  warehouseId: string;
  slotOrder: number;
  productId: string;
  variantId: string;
  baseUnit: string;
  packUnit: string;
  shippingUnit: string;
  quantity: number;
  description: string;
  notice: string;
  specialLabel: string[];
  createdAt: string;
  updatedAt: string;
};

export type GetOrderSlotResult =
  | {
      success: true;
      data: OrderSlotDTO[];
      message: string;
      meta: {
        pagination: Pagination;
      };
    }
  | {
      success: false;
      error: string;
    };

export type UomDTO = {
  id: string;
  name: string;
  abbreviation: string;
  levelBaseUnit: number;
  conversionFactor: number;
};

export type GetUomResult =
  | {
      success: true;
      data: UomDTO[];
      message: string;
      meta: {
        pagination: Pagination;
      };
    }
  | {
      success: false;
      error: string;
    };
