import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import { AppSidebarSeller } from '@/app/(seller)/_components/sidebar/app-sidebar-seller';
import { SiteHeaderSeller } from '@/app/(seller)/_components/sidebar/site-header-seller';
import { requireSeller } from '@/lib/require-admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSeller();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebarSeller variant="inset" />
      <SidebarInset>
        <SiteHeaderSeller />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 h-full">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
