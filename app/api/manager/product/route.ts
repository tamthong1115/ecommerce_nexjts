import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { Prisma, Visibility } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { NextRequest } from 'next/server';
import { HttpStatus } from '@/types/api';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
  const skip = (page - 1) * limit;

  const visibleFilter = searchParams.get('filter');
  const whereClause: Prisma.ProductWhereInput = {};

  if (visibleFilter) {
    const check = visibleFilter.toUpperCase();
    if (check in Visibility) {
      whereClause.visibility = check as Visibility;
    }
  }

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        soldCount: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: { variants: true },
        },
      },
      skip,
      take: limit,
      orderBy: { soldCount: 'desc' },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const response = ResponseFactory.paginated({
    data,
    page,
    limit,
    total,
    message: 't_success',
    code: HttpStatus.OK,
  });

  return ResponseFactory.toNextResponse(response);
});

export const PUT = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, visibility } = body;

    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    if (!visibility) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_visibility_field',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    await prisma.product.update({
      where: { id },
      data: { visibility },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
