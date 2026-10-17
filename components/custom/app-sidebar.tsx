'use client';
import React from 'react';
import { Sidebar } from '../ui/sidebar';

import { Skeleton } from '@/components/ui/skeleton';
import { BsTicketPerforated } from 'react-icons/bs';
import { FaCcAmazonPay, FaCreditCard } from 'react-icons/fa';

import { categoryIconMap } from '@/constants/category-icon-map';
import { useCategories } from '@/hooks/use-categories';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const extensions = [
  {
    title: 'promotion',
    url: '#',
    icon: BsTicketPerforated,
  },
  {
    title: 'pay_top_up',
    url: '#',
    icon: FaCreditCard,
  },
  {
    title: 'pay_later',
    url: '#',
    icon: FaCcAmazonPay,
  },
];

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const { categories, loading, error } = useCategories();
  const topCategories = categories.filter((cat) => cat.parentId === null);

  const t = useTranslations('home_layout.app_sidebar');
  //console.log('top category:', topCategories);

  const renderCategories = () => {
    if (loading) {
      return (
        <div className="w-full space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full px-3 py-4 rounded-lg transition-all"
            >
              <div className="flex flex-row gap-1.5 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-3 py-4 text-sm text-destructive">
          {t('load_failed')}
        </div>
      );
    }

    return topCategories.map((item, key) => (
      <div
        key={key}
        className="w-full hover:bg-secondary hover:text-primary hover:cursor-pointer px-3 py-4 rounded-lg transition-all"
      >
        <a
          href={`/search?category=${item.slug}&page=1&limit=20`}
          className="flex flex-row gap-1.5 justify-start items-center"
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={20}
              height={20}
              className="rounded-2xl"
            />
          ) : (
            <IconComponent
              slug={item.slug}
              size={20}
              color="var(--primary)"
            />
          )}
          <p className="text-sm">
            {t.has(item.slug) ? t(item.slug) : item.name}
          </p>
        </a>
      </div>
    ));
  };

  return (
    <div {...props}>
      <div className="w-full overflow-y-auto min-h-[calc(100vh-120px)] scrollbar-hide ">
        <div className="flex flex-col jus-end items-end">
          <div className="w-[70%] p-2 bg-background-secondary rounded-lg border border-primary flex flex-col justify-start items-start">
            {/* title */}
            <p className="font-bold text-base px-5 py-1 text-primary">
              {t('category')}
            </p>

            <div className="flex flex-col justify-start items-start pl-2">
              {renderCategories()}
            </div>
          </div>

          <div className="w-[70%] p-2 bg-background-secondary rounded-lg border border-primary flex flex-col justify-start items-start mt-4">
            {/* title */}
            <p className="font-bold text-base px-5 py-1 text-primary">
              {t('extensions')}
            </p>

            <div className="flex flex-col justify-start items-start pl-2 gap-2 w-full">
              {loading ? (
                <div className="w-full space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full px-3 py-4 rounded-lg transition-all"
                    >
                      <div className="flex flex-row gap-1.5 items-center">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                extensions.map((item, key) => (
                  <div
                    key={key}
                    className="w-full hover:bg-secondary hover:text-primary hover:cursor-pointer px-3 py-4 rounded-lg transition-all"
                  >
                    <a
                      href={item.url}
                      className="flex flex-row gap-1.5 justify-start items-center"
                    >
                      <item.icon size={20} color="var(--primary)" />
                      <p className="text-sm">{t(item.title)}</p>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const IconComponent = ({
  slug,
  size = 20,
  color = 'var(--primary)',
}: {
  slug: string;
  size?: number;
  color?: string;
}) => {
  const Icon = categoryIconMap[slug] || categoryIconMap['default'];
  return Icon ? <Icon size={size} color={color} /> : null;
};
