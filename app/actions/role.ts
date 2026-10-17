import { auth, getSessionUser } from '@/lib/auth';
import { Role } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export async function upgradeToSeller(userId?: string) {
  const session = await getSessionUser();
  const targetUserId = userId || session?.user?.id;

  if (!targetUserId) return;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      _count: {
        select: {
          shopsOwned: true,
          shopMemberships: true,
        },
      },
    },
  });

  if (!user) return;

  if (user.role === Role.admin) {
    return;
  }

  const isEligible =
    user._count.shopsOwned > 0 || user._count.shopMemberships > 0;
  if (!isEligible) {
    throw new Error('Forbidden: User does not own a shop or belong to any shop.');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: Role.seller },
  });

  try {
    const reqHeaders = await headers();
    await auth.api.getSession({
      headers: reqHeaders,
      query: { disableCookieCache: true },
    });
  } catch {
    // Headers might not be available in internal background contexts
  }
}

