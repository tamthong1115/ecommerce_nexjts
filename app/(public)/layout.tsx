import HeaderServer from '@/features/public/components/header-server';
import { ReactNode } from 'react';
import { Footer } from '@/features/public/components/footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <HeaderServer />
      <main className="flex-1 w-full bg-background">{children}</main>
      <Footer />
    </div>
  );
}
