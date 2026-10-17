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
  const title = searchParams.get('title');
  const shopId = searchParams.get('shopId');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  if (!id && !title && !shopId) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_search_params',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  const whereClause: Prisma.ProductWhereInput = {};

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
  } else if (title) {
    whereClause.title = {
      contains: title,
      mode: 'insensitive',
    };
  } else if (shopId) {
    const isValidUUID = z.string().uuid().safeParse(shopId).success;
    if (!isValidUUID) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_invalid_id_format',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }
    whereClause.shopId = shopId;
  }

  try {
    const [total, data] = await prisma.$transaction([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          shop: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          title: true,
          status: true,
          visibility: true,
          _count: {
            select: {
              variants: true,
            },
          },
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
