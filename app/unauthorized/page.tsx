'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UnauthorizedPage() {
  const t = useTranslations('unauthorized_page');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        {t('desc')}
      </p>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">{t('return_home')}</Link>
        </Button>
      </div>
    </div>
  );
}

