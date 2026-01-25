'use client';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const SelectLanguage = () => {
  const t = useTranslations('layout');
  const locale = useLocale();
  const router = useRouter();

  const changeLang = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    router.refresh();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={'icon'}
          className={'text-primary w-fit px-1.5 py-1 hover:cursor-pointer'}
        >
          <span className="hidden lg:inline">{t('language')}</span>
          <Image
            src={t('icon')}
            alt="flag-country"
            width={50}
            height={50}
            className="object-contain lg:hidden"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 drop-shadow-md drop-shadow-secondary">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(val) => changeLang(val)}
        >
          <DropdownMenuRadioItem value={'vi'}>
            <div className="flex flex-row justify-center items-center gap-2 hover:cursor-pointer">
              <Image
                width="48"
                height="48"
                src="https://img.icons8.com/color/48/vietnam.png"
                alt="vietnam"
              />
              <p>Tiếng Việt</p>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'en'}>
            <div className="flex flex-row justify-center items-center gap-2 hover:cursor-pointer">
              <Image
                width="48"
                height="48"
                src="https://img.icons8.com/color/48/great-britain.png"
                alt="great-britain"
              />
              <p>English</p>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'jp'}>
            <div className="flex flex-row justify-center items-center gap-2 hover:cursor-pointer">
              <Image
                width="48"
                height="48"
                src="https://img.icons8.com/?size=100&id=22435&format=png&color=000000"
                alt="japan"
              />
              <p>日本語</p>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
