import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, Locale } from '@/i18n/config';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale(): Promise<Locale> {
  const rawLocale = (await cookies()).get(COOKIE_NAME)?.value;
  if (rawLocale && (locales as readonly string[]).includes(rawLocale)) {
    return rawLocale as Locale;
  }
  return defaultLocale;
}

const MESSAGE_DOMAINS = [
  'main/auth',
  'main/cart',
  'main/checkout',
  'main/common',
  'main/customer',
  'main/home',
  'main/product',
  'main/search',
  'main/shop',
  'manager/category',
  'manager/dashboard',
  'manager/general',
  'manager/notification',
  'manager/product',
  'manager/shop',
  'manager/statistic',
  'manager/user',
  'manager/warehouse',
  'manager/access',
  'manager/i18n',
  'seller/seller',
] as const;

import { loadMessages } from '@/lib/i18n/load';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
  };
});
