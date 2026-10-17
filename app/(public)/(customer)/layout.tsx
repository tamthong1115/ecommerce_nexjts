import { ReactNode } from 'react';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserNav from '@/features/account/components/user-nav';
import { paths } from '@/lib/path';

export default async function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionUser();

  if (!session || !session.user) {
    return redirect(paths.login);
  }

  return (
    <div className="bg-background-darker">
      <div className="container mx-auto grid grid-cols-14 gap-6 py-6 ">
        <aside className="col-span-12 md:col-span-3 border-none">
          <UserNav
            user={{
              name: session.user.name ?? '',
              email: session.user.email ?? '',
              avatar_url: session.user.image ?? undefined,
            }}
          />
        </aside>
        <main className="col-span-12 md:col-span-9 h-fit rounded-2xl bg-background-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
