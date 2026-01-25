'use client';

import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  Ticket,
} from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

import { useTranslations } from 'next-intl';
import { AiOutlineProduct } from 'react-icons/ai';
import { BsGraphUpArrow } from 'react-icons/bs';
import { CiBoxList, CiShop } from 'react-icons/ci';
import { GoPeople } from 'react-icons/go';
import { FaWarehouse } from 'react-icons/fa';

type Role = 'USER' | 'SELLER' | 'ADMIN';

type HeaderUser = {
  name: string;
  email?: string;
  avatar_url?: string;
  role: Role;
} | null;

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: HeaderUser;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const t = useTranslations('admin_layout.admin_app_sidebar');

  const data = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: '2T3H Inc',
        logo: GalleryVerticalEnd,
        plan: 'Enterprise',
      },
      {
        name: 'Acme Corp.',
        logo: AudioWaveform,
        plan: 'Startup',
      },
      {
        name: 'Evil Corp.',
        logo: Command,
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: t('t_dashboard'),
        url: '#',
        icon: SquareTerminal,
        items: [
          {
            title: t('t_dashboard'),
            url: '/manager',
          },
        ],
      },
      {
        title: t('t_category'),
        url: '#',
        icon: CiBoxList,
        items: [
          {
            title: t('t_category_management'),
            url: '/manager/categories',
          },
        ],
      },
      {
        title: t('t_product'),
        url: '#',
        icon: AiOutlineProduct,
        items: [
          {
            title: t('t_product_management'),
            url: '/manager/products',
          },
          {
            title: t('t_complaint'),
            url: '/manager/products/complaints',
          },
        ],
      },
      {
        title: t('t_shop'),
        url: '#',
        icon: CiShop,
        items: [
          {
            title: t('t_shop_management'),
            url: '/manager/shops',
          },
          {
            title: t('t_support'),
            url: '#',
          },
          {
            title: t('t_complaint'),
            url: '#',
          },
        ],
      },
      {
        title: t('t_user'),
        url: '#',
        icon: GoPeople,
        items: [
          {
            title: t('t_user_management'),
            url: '/manager/users',
          },
          {
            title: t('t_support'),
            url: '#',
          },
          {
            title: t('t_complaint'),
            url: '#',
          },
        ],
      },
      {
        title: 'Vouchers',
        url: '#',
        icon: Ticket,
        items: [
          {
            title: 'View vouchers',
            url: '/manager/vouchers',
          },
        ],
      },
      {
        title: t('t_warehouse'),
        url: '#',
        icon: FaWarehouse,
        items: [
          {
            title: t('t_warehouse_list'),
            url: '/manager/warehouse',
          },
          {
            title: t('t_region_list'),
            url: '#',
          },
        ],
      },
      {
        title: t('t_statistic'),
        url: '#',
        icon: BsGraphUpArrow,
        items: [
          {
            title: t('t_revenue'),
            url: '/manager/statistic/revenue',
          },
          {
            title: t('t_traffic'),
            url: '#',
          },
          {
            title: t('t_user'),
            url: '#',
          },
          {
            title: t('t_shop'),
            url: '#',
          },
        ],
      },
      {
        title: t('t_settings'),
        url: '#',
        icon: Settings2,
        items: [
          {
            title: t('t_general'),
            url: '#',
          },
          {
            title: t('t_feedback'),
            url: '#',
          },
          {
            title: t('t_payment'),
            url: '#',
          },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
