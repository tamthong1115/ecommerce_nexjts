import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import z from 'zod';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const ownerId = searchParams.get('ownerId');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  if (!id && !name && !ownerId)
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_search_params',
        code: HttpStatus.BAD_REQUEST,
      })
    );

  const whereClause: Prisma.ShopWhereInput = {};

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
  } else if (name)
    whereClause.name = {
      contains: name,
      mode: 'insensitive',
    };
  else if (ownerId) {
    const isValidUUID = z.string().uuid().safeParse(ownerId).success;

    if (!isValidUUID) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_invalid_id_format',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    whereClause.ownerId = ownerId;
  }

  try {
    const [total, data] = await prisma.$transaction([
      prisma.shop.count({ where: whereClause }),
      prisma.shop.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              id: true,
              image: true,
              name: true,
            },
          },
          status: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
        },
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
