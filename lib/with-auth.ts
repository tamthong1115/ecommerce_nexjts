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

export function withAdmin(
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
) {
  return async function (request: NextRequest) {
    const session = await getSessionUser();
    const userId = session?.user?.id;
    const role = session?.user?.role?.toLowerCase();

    if (!userId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: 401,
        })
      );
    }

    const { loadSubject } = await import('@/lib/authz/load');
    const { can } = await import('@/lib/authz/policy');
    const subject = await loadSubject(userId);

    const hasRbacAdmin = subject ? (can(subject, 'platform:admin:access') || can(subject, '*')) : false;
    const isLegacyAdmin = role === 'admin';

    if (!hasRbacAdmin && !isLegacyAdmin) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Forbidden: Admin access required',
          code: 403,
        })
      );
    }

    return handler(userId, request);
  };
}

