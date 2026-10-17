import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { NextRequest } from 'next/server';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  const data = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      children: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return ResponseFactory.toNextResponse(
    ResponseFactory.success({ data: data, message: 't_success' })
  );
});
