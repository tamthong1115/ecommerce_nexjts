import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

// Query api: Get all data of one shop
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
    const data = await prisma.shop.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        status: true,
        ratingAvg: true,
        ratingCount: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Shop not found',
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
