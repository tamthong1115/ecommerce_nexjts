import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_id',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  try {
    const data = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        parentId: true,
        imageUrl: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

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
        data,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: 't_missing_id',
        code: HttpStatus.BAD_REQUEST,
      })
    );
  }

  try {
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_invalid_active_status',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    await prisma.category.update({
      where: { id },
      data: { isActive },
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
