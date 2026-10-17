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

  // Ensure valid integers for pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
  const skip = (page - 1) * limit;

  // Check valid params (one of them must exist)
  if (!id && !name) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_search_params',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  const whereClause: Prisma.CategoryWhereInput = {};

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
  }

  try {
    // Run Count and Find in parallel for performance
    const [total, data] = await prisma.$transaction([
      prisma.category.count({ where: whereClause }),
      prisma.category.findMany({
        where: whereClause,
        select: {
          id: true,
          isActive: true,
          name: true,
          parentId: true,
          slug: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data,
        total,
        page,
        limit,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (e) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(e));
  }
});
