'use client';

import { DollarSign, Loader2, ShieldCheck, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserProfileResponseDTO } from '@/features/account/profile/profile.dto';

interface BusinessClientProps {
  user: UserProfileResponseDTO | null;
}

export default function BusinessClient({ user }: BusinessClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const route = useRouter();
  const pathname = usePathname();
  const handleSellerRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.status === 403 && data.error === 'MISSING_PROFILE') {
        toast.warning(data.message, { duration: 3000 });
        const currentUrl = encodeURIComponent(pathname);
        route.push(`/customer/account/edit?callbackUrl=${currentUrl}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create seller account');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const t = useTranslations('signup_business_page');
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-background-secondary rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-info/85 p-8 text-center text-primary-foreground">
          <div className="mx-auto bg-info w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-primary-foreground">
            {t('t_title')}{' '}
          </h1>
          <p className="text-primary-foreground">{t('t_desc')}</p>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-6 text-center border-b border-border">
          <div className="p-4">
            <div className="mx-auto w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center mb-3">
              <DollarSign size={20} />
            </div>
            <h3 className="font-semibold text-text">{t('t_slogan_1')}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('t_slogan_desc_1')}
            </p>
          </div>
          <div className="p-4">
            <div className="mx-auto w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-text">{t('t_slogan_2')}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('t_slogan_desc_2')}
            </p>
          </div>
          <div className="p-4">
            <div className="mx-auto w-10 h-10 bg-error/10 text-error rounded-full flex items-center justify-center mb-3">
              <Store size={20} />
            </div>
            <h3 className="font-semibold text-text">{t('t_slogan_3')}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('t_slogan_desc_3')}
            </p>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center">
          <p className="text-text-secondary mb-6 text-center">
            {t('t_invite_speech')}
          </p>

          <button
            onClick={handleSellerRegister}
            disabled={isLoading}
            className="bg-primary/60 hover:bg-primary/90 hover:cursor-pointer text-primary-foreground font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> {t('t_loading')}
              </>
            ) : (
              t('t_signup_button')
            )}
          </button>

          <p className="text-xs text-text-secondary mt-4">
            {t('t_accept_policy')}
          </p>
        </div>
      </div>
    </div>
  );
}
