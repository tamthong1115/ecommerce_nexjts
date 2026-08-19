import 'server-only';

import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const session = await getSessionUser();

  if (!session || !session.user) {
    return redirect('/login');
  }

  if (session.user.role !== 'admin') {
    return redirect('/unauthorized');
  }

  return session;
}

export async function requireSeller() {
  const session = await getSessionUser();

  if (!session || !session.user) {
    return redirect('/login');
  }

  if (session.user.role !== 'seller' && session.user.role !== 'admin') {
    return redirect('/unauthorized');
  }
  return session;
}
