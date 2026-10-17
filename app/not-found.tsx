'use client';
import { ModeToogle } from '@/components/custom/mode-toogle';
import { SelectLanguage } from '@/components/custom/select-language';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const t = useTranslations('not_found_page');
  const router = useRouter();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-3">
      <div className="w-full h-fit flex flex-row justify-end items-center gap-3">
        <SelectLanguage />
        <ModeToogle />
      </div>
      <div className="w-full h-full flex flex-col justify-center items-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-primary/80">
          {t('not_found')}
        </h2>
        <p className="mb-8 text-center text-gray-500 max-w-md">{t('desc')}</p>
        <Button
          variant={'outline'}
          type="button"
          className="hover:cursor-pointer"
          onClick={() => router.back()}
        >
          {t('return')}
        </Button>
      </div>
    </div>
  );
}
