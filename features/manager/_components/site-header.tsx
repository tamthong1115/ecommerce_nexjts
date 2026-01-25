'use client';

import { ModeToogle } from '@/components/custom/mode-toogle';
import { SelectLanguage } from '@/components/custom/select-language';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function SiteHeader() {
  const pathname = usePathname(); // <-- Get the current path
  // const title = getTitleFromPath(pathname); // <-- Get the dynamic title
  const t = useTranslations('admin_layout.admin_app_sidebar');

  /**
   * A helper function to map pathnames to titles.
   * You can customize this logic as much as you need.
   */
  function getTitleFromPath(path: string): string {
    //console.log(path);
    // 1. Create a map for your specific routes
    const titleMap: Record<string, string> = {
      '/manager/categories': 't_category_management',
      '/manager/product': 't_product_management',
      '/manager/products/complaints': 't_complaint',
      '/manager/users': 't_user_management',
      '/manager/shops': 't_shop_management',
      '/manager/statistic/revenue': 't_revenue',
      '/manager/warehouse': 't_warehouse_management',
      '/manager': 't_dashboard',
      '/manager/settings': 't_settings',
    };

    // 2. Check if the exact path is in the map
    if (titleMap[path]) {
      return titleMap[path];
    }

    // 3. Fallback logic: Try to find a dynamic match
    // For example, if the path is "/manager/product/123", we still want "Products"
    // We sort keys by length (longest first) to match "/manager/product" before "/manager"
    const matchingKey = Object.keys(titleMap)
      .sort((a, b) => b.length - a.length)
      .find((key) => path.startsWith(key));

    if (matchingKey) {
      return titleMap[matchingKey];
    }

    // 4. Generic fallback: Capitalize the last part of the URL
    const lastSegment = path.split('/').filter(Boolean).pop();
    if (lastSegment) {
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }

    // 5. Default title if no other match is found
    return 'Documents';
  }

  const title = useMemo(() => {
    return getTitleFromPath(pathname);
  }, [pathname]);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Use the dynamic title variable here */}
        <div className="w-full flex flex-row justify-between items-center">
          <h1 className="text-base font-medium">{t(title)}</h1>
          <div className="flex flex-row items-center gap-4">
            <SelectLanguage />
            <ModeToogle />
          </div>
        </div>
      </div>
    </header>
  );
}
