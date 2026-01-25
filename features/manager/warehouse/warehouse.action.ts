'use server';

import { ApiResponse, HttpStatus } from '@/types/api';
import { WarehouseDTO } from './warehouse.dto';
import { ResponseFactory } from '@/lib/api-response';
import { getCurrentUserId } from '@/lib/auth';
import { WarehouseService } from './warehouse.service';

export async function createWarehouse(
  formData: FormData
): Promise<ApiResponse<WarehouseDTO>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return ResponseFactory.error({
        message: 't_unauthorized',
        code: HttpStatus.UNAUTHORIZED,
      });
    }

    const rawData = Object.fromEntries(formData.entries());
    if (!rawData.data) {
      return ResponseFactory.error({
        message: 't_missing_data_field',
        code: HttpStatus.BAD_REQUEST,
      });
    }

    const data = JSON.parse(rawData.data as string);
    const newWarehouse = await WarehouseService.createWarehouse(userId, data);

    return ResponseFactory.success({
      data: newWarehouse,
      message: 't_success',
      code: HttpStatus.CREATED,
    });
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function getWarehouse({
  params,
}: {
  params: Record<string, string | number>;
}): Promise<ApiResponse<WarehouseDTO[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return ResponseFactory.error({
        message: 't_unauthorized',
        code: HttpStatus.UNAUTHORIZED,
      });
    }

    const page = Number(params['page']) || 1;
    const limit = Number(params['limit']) || 10;
    const filter = params['filter'] || '';

    const result = await WarehouseService.getWarehouse(
      userId,
      page,
      limit,
      filter.toString()
    );
    const totalPages = Math.ceil(result.length / (limit || 1));

    return ResponseFactory.success({
      data: result,
      meta: {
        pagination: {
          page: page,
          limit: limit,
          total: result.length,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      message: 't_success',
      code: HttpStatus.OK,
    });
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}
