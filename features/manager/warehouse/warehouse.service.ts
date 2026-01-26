import { ServiceError } from '@/lib/service-error';
import { WarehouseDTO, WarehouseRequestDTO } from './warehouse.dto';
import { prisma } from '@/lib/db';
import { Prisma, Region, WarehouseStatus } from '@/lib/generated/prisma';

export class WarehouseService {
  static async createWarehouse(
    userId: string,
    data: WarehouseRequestDTO
  ): Promise<WarehouseDTO> {
    if (!userId) {
      throw new ServiceError('Unauthorized', 401);
    }

    const newWarehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        street: data.street,
        ward: data.ward,
        district: data.district,
        city: data.city,
        address: data.address,
        size: data.size,
        region: data.region as Region,
        status: data.status as WarehouseStatus,
        totalStorageArea: data.totalStorageArea,
        totalSlot: data.totalSlot,
      },
    });
    return newWarehouse;
  }

  static async getWarehouse(
    userId: string,
    page: number,
    limit: number,
    filter: string
  ): Promise<WarehouseDTO[]> {
    if (!userId) {
      throw new ServiceError('Unauthorized', 401);
    }

    const skip = (page - 1) * limit;

    const whereClause: Prisma.WarehouseWhereInput = {
      status: filter as WarehouseStatus,
    };

    const data: WarehouseDTO[] = await prisma.warehouse.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
    });

    return data;
  }
}
