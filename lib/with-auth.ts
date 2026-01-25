import { getSessionUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';

export function withAuth(
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
) {
  return async function (request: NextRequest) {
    const session = await getSessionUser();
    const userId = session?.user?.id;

    if (!userId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: 401,
        })
      );
    }

    return handler(userId, request);
  };
}
