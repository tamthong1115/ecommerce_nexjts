import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

export const GET = withAuth(async (userId: string, request: NextRequest) => {
  try {
    if (!userId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_unauthorized_desc_noti',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_query',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const data = await prisma.warehouse.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        street: true,
        city: true,
        ward: true,
        district: true,
        region: true,
        size: true,
        totalStorageArea: true,
        totalSlot: true,
        status: true,
        storageArea: {
          where: {
            warehouseId: id,
          },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            totalSlots: true,
            totalFloors: true,
            totalRows: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    //console.log(data);

    if (!data) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_not_found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: data,
        message: 't_success_desc_noti',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
