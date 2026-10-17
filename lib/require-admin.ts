import 'server-only';

import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { paths } from '@/lib/path';

import { prisma } from '@/lib/db';

export async function requireAdmin() {
  const session = await getSessionUser();

  if (!session || !session.user) {
    return redirect(paths.login);
  }

  let role = session.user.role?.toLowerCase();
  if (role !== 'admin') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role) {
      role = dbUser.role.toLowerCase();
    }
  }

  if (role !== 'admin') {
    const { loadSubject } = await import('@/lib/authz/load');
    const { can } = await import('@/lib/authz/policy');
    const subject = await loadSubject(session.user.id);
    const hasAdminPerm = subject ? (can(subject, 'platform:admin:access') || can(subject, '*')) : false;

    if (!hasAdminPerm) {
      return redirect('/unauthorized');
    }
  }

  return session;
}

export async function requireSeller() {
  const session = await getSessionUser();

  if (!session || !session.user) {
    return redirect(paths.login);
  }

  let role = session.user.role?.toLowerCase();
  if (role !== 'seller' && role !== 'admin') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role) {
      role = dbUser.role.toLowerCase();
    }
  }

  if (role !== 'seller' && role !== 'admin') {
    const { loadSubject } = await import('@/lib/authz/load');
    const { can } = await import('@/lib/authz/policy');
    const subject = await loadSubject(session.user.id);
    const hasSellerPerm = subject
      ? (can(subject, 'shop:seller:access') ||
         can(subject, 'shop:*') ||
         can(subject, '*') ||
         subject.roles.some((r) => r.scope === 'SHOP'))
      : false;

    if (!hasSellerPerm) {
      return redirect('/unauthorized');
    }
  }
  return session;
}
