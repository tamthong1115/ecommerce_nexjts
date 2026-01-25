import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/i18n/config';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  // Load all files
  const [
    auth,
    cart,
    checkout,
    common,
    customer,
    home,
    product,
    search,
    shop,
    m_general,
    m_dashboard,
    m_category,
    m_product,
    m_shop,
    m_user,
    m_warehouse,
    m_statistic,
    m_notification,
    seller,
  ] = await Promise.all([
    // Main domain files
    import(`../messages/${locale}/main/auth.json`),
    import(`../messages/${locale}/main/cart.json`),
    import(`../messages/${locale}/main/checkout.json`),
    import(`../messages/${locale}/main/common.json`),
    import(`../messages/${locale}/main/customer.json`),
    import(`../messages/${locale}/main/home.json`),
    import(`../messages/${locale}/main/product.json`),
    import(`../messages/${locale}/main/search.json`),
    import(`../messages/${locale}/main/shop.json`),
    // manager domains
    import(`../messages/${locale}/manager/m_general.json`),
    import(`../messages/${locale}/manager/m_dashboard.json`),
    import(`../messages/${locale}/manager/m_category.json`),
    import(`../messages/${locale}/manager/m_product.json`),
    import(`../messages/${locale}/manager/m_shop.json`),
    import(`../messages/${locale}/manager/m_user.json`),
    import(`../messages/${locale}/manager/m_warehouse.json`),
    import(`../messages/${locale}/manager/m_statistic.json`),
    import(`../messages/${locale}/manager/m_notification.json`),
    // seller domains
    import(`../messages/${locale}/seller/seller.json`),
  ]);

  return {
    locale,
    messages: {
      // So if cart.json contains "cart_page": {...}, it becomes accessible as t('cart_page').
      ...auth.default,
      ...cart.default,
      ...checkout.default,
      ...common.default,
      ...customer.default,
      ...home.default,
      ...product.default,
      ...search.default,
      ...shop.default,
      ...seller.default,
      ...m_general.default,
      ...m_product.default,
      ...m_user.default,
      ...m_dashboard.default,
      ...m_category.default,
      ...m_shop.default,
      ...m_warehouse.default,
      ...m_statistic.default,
      ...m_notification.default,
    },
  };
});
