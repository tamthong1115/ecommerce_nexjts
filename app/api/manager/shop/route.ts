import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { Prisma, ShopStatus } from '@/lib/generated/prisma';
import { sendShopStatusChangeEmail } from '@/features/notification/server/email/lib/mailer';
import { withAuth } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

export const GET = withAuth(async (userId: string, request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const skip = (page - 1) * limit;

  const status = searchParams.get('filter')?.toString();

  const whereClause: Prisma.ShopWhereInput = {};

  if (status !== null) {
    const check = status?.toUpperCase();
    if (check && check in ShopStatus) whereClause.status = check as ShopStatus;
  }

  const data = await prisma.shop.findMany({
    where: whereClause,
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
    skip,
    take: limit,
    orderBy: { id: 'asc' },
  });

  const total = await prisma.shop.count({
    where: whereClause,
  });

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
});

export const PUT = withAuth(async (userId: string, request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    if (!status) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_status',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        status: status,
      },
      include: {
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    await sendShopStatusChangeEmail(
      shop.owner.email,
      shop.name,
      shop.owner.name || 'Shop Owner',
      status
    );

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
