'use client';

import * as React from 'react';
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconSearch,
  IconSettings,
  IconShoppingCart,
} from '@tabler/icons-react';

// import { NavDocuments } from "@/_components/nav-documents";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/public/logo.jpg';
import { env } from '@/lib/env';
import { authClient } from '@/lib/auth-client';
import { AppLoader } from '@/components/ui/loader';
import { NavMainSeller } from '@/app/(seller)/_components/sidebar/nav-main-seller';
import { NavSecondarySeller } from '@/app/(seller)/_components/sidebar/nav-secondary-seller';
import { NavSeller } from '@/app/(seller)/_components/sidebar/nav-seller';
import { ListOrdered, Ticket, Wallet } from 'lucide-react';
import { paths } from '@/lib/path';

const WEB_NAME = env.NEXT_PUBLIC_WEB_NAME;

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/seller',
      icon: IconDashboard,
    },
    {
      title: 'Products',
      url: '#',
      icon: IconListDetails,
      items: [
        {
          title: 'All Products',
          url: '/seller/products',
        },
        {
          title: 'Add Product',
          url: '/seller/products/create',
        },
      ],
    },
    {
      title: 'Shops',
      url: '#',
      icon: IconShoppingCart,
      items: [
        {
          title: 'All Shops',
          url: '/seller/shops',
        },
        {
          title: 'Add Shop',
          url: '/seller/shops/create',
        },
      ],
    },
    {
      title: 'Orders',
      url: '/seller/orders',
      icon: ListOrdered,
    },
    {
      title: 'Voucher',
      url: '/seller/voucher',
      icon: Ticket,
    },
    {
      title: 'Transaction',
      url: '#',
      icon: Wallet,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: IconSettings,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
    },
  ],
};

export function AppSidebarSeller({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();

  const renderFooterUser = () => {
    if (isPending) {
      return <AppLoader label="Loading..." />;
    }
    if (session) {
      return <NavSeller user={session.user} />;
    }
    return null;
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Logo} alt="Logo" className="size-5" />
                <span className="text-base font-semibold">{WEB_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMainSeller items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondarySeller items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {renderFooterUser()}
      </SidebarFooter>
    </Sidebar>
  );
}
