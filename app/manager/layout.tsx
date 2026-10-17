import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import AppSidebarServer from '../../features/manager/_components/app-sidebar-server';
import { SiteHeader } from '../../features/manager/_components/site-header';
import { requireAdmin } from '@/lib/require-admin';

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebarServer />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
