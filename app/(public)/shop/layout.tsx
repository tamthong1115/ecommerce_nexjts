'use client';
import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import SearchingBar from '@/features/public/components/searching-bar';
import { fetchData } from '@/funcs/fetch';
import { useIsMobile } from '@/hooks/use-mobile';
import { shopData } from '@/types/public.data-types';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';
import { MdOutlineRateReview } from 'react-icons/md';

const ShopPage = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const [shopData, setShopData] = useState<shopData | null>(null);
  const isMobile = useIsMobile();
  const t = useTranslations('shop_layout');
  const decodedSlug = useMemo(() => {
    return decodeURIComponent(params.slug as string);
  }, [params]);

  useEffect(() => {
    const fetch = async () => {
      const res = await fetchData({
        baseUrl: '/api/shop/query',
        params: { slug: decodedSlug },
        setData: undefined,
      });
      if (res) {
        //console.log(res);
        setShopData(res.data);
      }
    };
    fetch();
  }, []);

  if (!shopData)
    return (
      <div className="w-screen h-screen">
        <Loading />
      </div>
    );

  return (
    <div className="w-full flex flex-col justify-center items-center gap-3 bg-background">
      {/* show shop info */}
      <div className="w-full h-fit bg-primary/60 flex justify-center items-center">
        <div className="relative w-fit h-fit">
          {/* show cover phto */}
          <Image
            src={shopData.coverUrl}
            width={1200}
            height={450}
            quality={90}
            alt="cover-photo"
          />
          {/* show a box with logo and others info */}
          <div className=" rounded-lg bg-background-secondary absolute left-2 bottom-2 p-3 flex flex-row justify-between items-center gap-5 drop-shadow-xs drop-shadow-primary border-2 broder-primary">
            {/* logo */}
            <Image
              src={shopData.logoUrl}
              width={200}
              height={200}
              alt="shop-logo"
              className="rounded-lg w-10 h-10"
            />
            {/* show name and rating */}
            <div className="flex flex-col justify-center items-start h-fit">
              <p>{shopData.name}</p>
              <div className="flex flex-row justify-start items-center gap-2 text-sm italic">
                <p className="flex flex-row gap-2 justify-start items-center">
                  {shopData.ratingAvg}{' '}
                  <FaStar size={15} color="var(--warning)" />
                </p>
                <Separator orientation="vertical" />
                <p>
                  {shopData.ratingCount} {t('t_review')}
                </p>
              </div>
            </div>
            {/* buttons action */}
            <div className="flex flex-col gap-2">
              <Button variant={'outline'} className="hover:cursor-pointer">
                <MdOutlineRateReview color="var(--primary)" />
                {t('t_review')}
              </Button>
              <Button variant={'outline'} className="hover:cursor-pointer">
                <IoChatboxEllipsesOutline color="var(--primary)" />
                {t('t_chat')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* navigator bar: will navigate to store page (home page), products, to-sale and one search bar */}
      <div className="w-[70%] flex flex-row justify-between items-center bg-background-secondary p-2 rounded-lg">
        <NavigationMenu viewport={isMobile}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('t_shop')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-full">
                  <li className="text-nowrap">
                    <NavigationMenuLink href="#">
                      {t('c_see_review')}
                    </NavigationMenuLink>
                  </li>
                  <li className="text-nowrap">
                    <NavigationMenuLink href={`/shop/${decodedSlug}`}>
                      {t('c_info_general')}
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('t_product')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-full">
                  <li className="text-nowrap">
                    <NavigationMenuLink
                      href={`/shop/${decodedSlug}/products?id=${shopData.id}&filter=`}
                    >
                      {t('c_all')}
                    </NavigationMenuLink>
                  </li>
                  <li className="text-nowrap">
                    <NavigationMenuLink
                      href={`/shop/${decodedSlug}/products?id=${shopData.id}&filter=new`}
                    >
                      {t('c_new')}
                    </NavigationMenuLink>
                  </li>
                  <li className="text-nowrap">
                    <NavigationMenuLink
                      href={`/shop/${decodedSlug}/products?id=${shopData.id}&filter=top`}
                    >
                      {t('c_special')}
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href={`/shop/${decodedSlug}/profile`}>
                {t('t_profile')}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="w-[40%]">
          <SearchingBar />
        </div>
      </div>
      <div className="w-[70%]">{children}</div>
    </div>
  );
};
export default ShopPage;
