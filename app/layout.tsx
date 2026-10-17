import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ToasterWrapper } from '@/app/toaster-wrapper';
import QueryProvider from '@/app/query-providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sàn Thương Mại Điện Tử - Mua Sắm Trực Tuyến',
    template: '%s | E-Commerce',
  },
  description:
    'Nền tảng mua sắm trực tuyến với hàng ngàn sản phẩm chính hãng, ưu đãi độc quyền và giao hàng nhanh chóng.',
};

import { PermissionsProvider } from '@/lib/authz/client';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const message = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={message}>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <PermissionsProvider>
                {children}
              </PermissionsProvider>
              <ToasterWrapper />
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
