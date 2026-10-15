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
  'seller/seller',
] as const;

async function loadMessagesForLocale(locale: Locale): Promise<Record<string, unknown>> {
  const loadedModules = await Promise.all(
    MESSAGE_DOMAINS.map(async (domain) => {
      try {
        const mod = await import(`../messages/${locale}/${domain}.json`);
        return mod.default;
      } catch {
        try {
          const fallbackMod = await import(`../messages/${defaultLocale}/${domain}.json`);
          return fallbackMod.default;
        } catch {
          return {};
        }
      }
    })
  );

  return Object.assign({}, ...loadedModules);
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = await loadMessagesForLocale(locale);

  return {
    locale,
    messages,
  };
});
