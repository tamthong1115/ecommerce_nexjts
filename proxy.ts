import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { paths } from '@/lib/path';

import { prisma } from '@/lib/db';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    paths.login,
    paths.verify_request,
    '/api/auth',
    '/products',
    '/api/products',
    '/api/stripe/webhook',
    '/search',
    '/shop',
    '/api/shop',
    '/',
  ];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const session = await getSessionUser();
  if (!session) {
    const url = new URL(paths.login, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  let userRole = session.user.role?.toLowerCase();

  if (
    userRole === 'user' &&
    (pathname.startsWith('/seller') || pathname.startsWith('/manager'))
  ) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (dbUser?.role) {
        userRole = dbUser.role.toLowerCase();
      }
    } catch {
      // Fall back to session cookie role if database query fails
    }
  }

  let hasSellerAccess = userRole === 'seller' || userRole === 'admin';
  let hasManagerAccess = userRole === 'admin';

  if (!hasSellerAccess || !hasManagerAccess) {
    try {
      const { loadSubject } = await import('@/lib/authz/load');
      const { can } = await import('@/lib/authz/policy');
      const subject = await loadSubject(session.user.id);

      if (subject) {
        if (!hasManagerAccess) {
          hasManagerAccess = can(subject, 'platform:admin:access') || can(subject, '*');
        }
        if (!hasSellerAccess) {
          hasSellerAccess = can(subject, 'shop:seller:access') ||
            can(subject, 'shop:*') ||
            can(subject, '*') ||
            subject.roles.some((r) => r.scope === 'SHOP');
        }
      }
    } catch {
      // Fallback to legacy checks if subject loading fails
    }
  }

  if (pathname.startsWith('/manager') && !hasManagerAccess) {
    return NextResponse.rewrite(new URL('/403', request.url));
  }

  if (pathname.startsWith('/seller') && !hasSellerAccess) {
    if (userRole === 'user') {
      return NextResponse.redirect(new URL('/signup-business', request.url));
    }
    return NextResponse.rewrite(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api/auth/callback|api|auth).*)'],
};
