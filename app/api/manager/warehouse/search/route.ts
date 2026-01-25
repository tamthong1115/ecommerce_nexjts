import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { Prisma, Region } from '@/lib/generated/prisma';
import { withAuth } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import z from 'zod';

export const GET = withAuth(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const region = searchParams.get('region');

  // Ensure valid integers for pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

  // Check valid params (one of them must exist)
  if (!id && !name && !region) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_query_params',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  const whereClause: Prisma.WarehouseWhereInput = {};

  if (id) {
    const isValidUUID = z.string().uuid().safeParse(id).success;

    if (!isValidUUID) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_invalid_id_format',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }
    whereClause.id = id;
  } else if (name) {
    whereClause.name = {
      contains: name,
      mode: 'insensitive',
    };
  } else if (region) {
    whereClause.region = region as Region;
  }

  try {
    const [total, data] = await prisma.$transaction([
      prisma.warehouse.count({ where: whereClause }),
      prisma.warehouse.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          region: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data,
        page,
        limit,
        total,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (e) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});
