'use client';

import { ModeToogle } from '@/components/custom/mode-toogle';
import { SelectLanguage } from '@/components/custom/select-language';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useSignOut } from '@/hooks/use-signout';
import { paths } from '@/lib/path';
import {
  BadgeCheck,
  Handshake,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Rotate3D,
  ShoppingCartIcon,
  Tag,
  Timer,
  Truck,
  Undo2,
  User2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchingBar from './searching-bar';
import { NotificationBell } from '@/features/notification/components/core/notification-bell';

type Role = 'USER' | 'SELLER' | 'ADMIN';
type HeaderUser = {
  name: string;
  email?: string;
  avatar_url?: string;
  role: Role;
} | null;

const HeaderClient = ({ user }: { user: HeaderUser }) => {
  const router = useRouter();

  const handleSingout = useSignOut();

  const t = useTranslations('home_layout');
  const n = useTranslations('' + 'customer.user_navbar');
  const handleHome = () => {
    router.push('/');
  };
  return (
    <div className="w-full h-fit  flex flex-col justify-center items-center relative">
      {/* logo, searching zone and tags  */}
      <div
        className={
          'w-full flex justify-center items-center transition-all duration-300 bg-background-secondary '
        }
      >
        <div className="w-[80%] h-fit p-2 flex flex-row justify-center items-center gap-4">
          {/* logo and slogan */}
          <div
            className="w-[10%] flex flex-col gap-1 justify-center items-center cursor-pointer"
            onClick={() => handleHome()}
          >
            <Image
              width={200}
              height={200}
              src="/logo.jpg"
              alt="logo"
              className=""
            />
            <p className="text-primary">{t('slogan')}</p>
          </div>
          {/* searching bar and tags  */}
          <div className="w-full flex flex-col justify-start items-start gap-1">
            {/* searching bar, change language*/}
            <div className="w-full gap-2 flex flex-row justify-center items-center">
              <SearchingBar />
              <SelectLanguage />
              <ModeToogle />
              <Button asChild variant="outline">
                <Link href="/cart" className="inline-flex items-center">
                  <ShoppingCartIcon className="w-5 h-5 text-primary" />
                </Link>
              </Button>
              <NotificationBell role="BUYER" />
              {/*  Auth */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 rounded-full hover:cursor-pointer"
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback>
                          <User2 className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      {user.name}
                    </DropdownMenuLabel>
                    {user.email ? (
                      <div className="px-2 pb-1 text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    ) : null}
                    <DropdownMenuSeparator />

                    {/*  User shortcuts*/}
                    <DropdownMenuItem asChild className="hover:cursor-pointer">
                      <Link
                        href="/customer/account/edit"
                        className="flex items-center gap-2"
                      >
                        <User2 className="h-4 w-4" />
                        {n('profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:cursor-pointer">
                      <Link
                        href="/customer/account/orders"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        {n('orders')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:cursor-pointer">
                      <Link
                        href="/customer/account/address"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        {n('addresses')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleSingout()}
                      className="text-destructive focus:text-destructive hover:cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {n('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link
                    href={paths.login}
                    className="inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {n('login')}
                  </Link>
                </Button>
              )}
            </div>
            {/* tags  */}
            <div className="flex flex-row justify-start items-center gap-3 text-primary text-sm">
              <Link href={''}>{t('electronics')}</Link>
              <Link href={''}>{t('vehicles')}</Link>
              <Link href={''}>{t('mom_baby')}</Link>
              <Link href={''}>{t('beauty')}</Link>
              <Link href={''}>{t('house')}</Link>
              <Link href={''}>{t('book')}</Link>
              <Link href={''}>{t('sports')}</Link>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      {/* slogans */}
      <div className="w-full h-10 pt-2 pr-2 pl-2 flex flex-row justify-center items-center gap-4 text-text font-medium text-xs bg-background-secondary">
        <Link href="" className="flex gap-1">
          <Handshake className="w-4 h-4 text-primary" />
          {t('commitment')}
        </Link>
        <Link href="" className="flex gap-1">
          <BadgeCheck className="w-4 h-4 text-primary" />
          {t('genuine_goods')}
        </Link>
        <Separator orientation="vertical" />
        <Link href="" className="flex gap-1">
          <Truck className="w-4 h-4 text-primary" />
          {t('free_ship_all')}
        </Link>
        <Separator orientation="vertical" />
        <Link href="" className="flex gap-1">
          <Rotate3D className="w-4 h-4 text-primary" />
          {t('refund_200')}
        </Link>
        <Separator orientation="vertical" />
        <Link href="" className="flex gap-1">
          <Undo2 className="w-4 h-4 text-primary" />
          {t('return_30_days')}
        </Link>
        <Separator orientation="vertical" />
        <Link href="" className="flex gap-1">
          <Timer className="w-4 h-4 text-primary" />
          {t('fast_delivery_2h')}
        </Link>
        <Separator orientation="vertical" />
        <Link href="" className="flex gap-1">
          <Tag className="w-4 h-4 text-primary" />
          {t('super_cheap_price')}
        </Link>
      </div>
    </div>
  );
};
export default HeaderClient;
