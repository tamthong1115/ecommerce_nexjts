import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';

//api to get list of user
export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const lockStatus = searchParams.get('filter');

    const whereClause: Prisma.UserWhereInput = {};

    // Only apply the filter if the parameter is actually present in the URL
    // If 'filter' is missing, return all users
    if (lockStatus !== null) {
      whereClause.banned = lockStatus === 'true';
    }

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          banned: true, // Added to see the status in the response
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { id: 'asc' },
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
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
