import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BusinessClient from '@/app/(public)/signup-business/_components/BusinessClient';
import { getUserProfile } from '@/features/account/profile/profile.data';
import { paths } from '@/lib/path';

import { prisma } from '@/lib/db';

export default async function SignupBusinessPage() {
  const session = await getSessionUser();
  if (!session || !session.user) {
    redirect(`${paths.login}?callbackUrl=/signup-business`);
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

  if (role === 'seller' || role === 'admin') {
    redirect('/seller');
  }
  const res = await getUserProfile(session.user.id);
  const user = res.success && res.data ? res.data : null;
  return <BusinessClient user={user} />;
}
