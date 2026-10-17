import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

//query api
//get all data of one product
export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Removed String() wrapper to correctly detect null
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
    const data = await prisma.user.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        profile: {
          select: {
            emailForBill: true,
            phone: true,
            gender: true,
          },
        },
        shopsOwned: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        shopMemberships: {
          select: {
            shop: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_user_not_found',
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
