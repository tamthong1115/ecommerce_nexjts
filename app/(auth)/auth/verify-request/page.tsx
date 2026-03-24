'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { authClient } from '@/lib/auth-client';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader, Mail, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { paths } from '@/lib/path';

export default function VerifyRequest() {
  const t = useTranslations('auth_login_page.verify_request_page');
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get('email');
  const callbackParam = params.get('callbackUrl') || '/';
  const typeParam = params.get('type'); // 'sign-in' or 'email-verification'

  const [otp, setOtp] = useState('');
  const [isPending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(0);

  const isOtpCompleted = otp.trim().length === 6;
  const email = emailParam || '';
  const isSignUp = typeParam === 'email-verification';

  // Resend OTP with cooldown
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;

    startTransition(async () => {
      try {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: isSignUp ? 'email-verification' : 'sign-in',
          fetchOptions: {
            onSuccess: () => {
              toast.success(t('t_resend_success'), {
                description: t('t_resend_success_desc'),
              });
              setResendCooldown(60);
              const interval = setInterval(() => {
                setResendCooldown((prev) => {
                  if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            },
            onError: (err) => {
              console.error(err);
              toast.error(t('t_resend_failed'));
            },
          },
        });

        if (error) {
          toast.error(error.message || t('t_resend_failed'));
        }
      } catch (err) {
        console.error('Unexpected error during resend:', err);
        toast.error(t('t_unexpected_error'));
      }
    });
  };

  const verifyOtp = () => {
    if (!email) {
      toast.error(t('t_email_missing'));
      return;
    }
    if (!isOtpCompleted) {
      toast.error(t('t_code_incomplete'));
      return;
    }

    startTransition(async () => {
      try {
        if (isSignUp) {
          // Email verification for sign-up
          const { error } = await authClient.emailOtp.verifyEmail({
            email,
            otp,
            fetchOptions: {
              onSuccess: () => {
                toast.success(t('t_verify_success'), {
                  description: t('t_verify_success_desc'),
                });
                router.replace(callbackParam);
                router.refresh();
              },
              onError: (err) => {
                console.error(err);
                toast.error(t('t_invalid_code'));
              },
            },
          });

          if (error) {
            return;
          }
        } else {
          // Sign-in with OTP
          const { data, error } = await authClient.signIn.emailOtp({
            email,
            otp,
            fetchOptions: {
              onSuccess: () => {
                toast.success(t('t_sign_in_success'));
              },
              onError: (err: Error) => {
                console.error(err);
                toast.error(t('t_invalid_code'));
              },
            },
          });

          if (error) {
            toast.error(error.message || t('t_sign_in_failed'));
            return;
          }

          if (!error && data) {
            router.replace(callbackParam);
            router.refresh();
          }
        }
      } catch (err) {
        console.error('Unexpected error during OTP verification:', err);
        toast.error(t('t_unexpected_error'));
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {isSignUp ? t('t_verify_email') : t('t_check_email')}
            </CardTitle>
            <CardDescription className="mt-2">
              {isSignUp ? t('t_verify_desc') : t('t_sign_in_desc')}
            </CardDescription>
          </div>

          {/* Email Display */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{t('t_code_sent')}</p>
            <p className="font-medium text-foreground">{email}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="flex flex-col items-center space-y-3">
            <InputOTP
              value={otp}
              onChange={(value) => setOtp(value)}
              maxLength={6}
              className="gap-2 flex"
              disabled={isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center">
              {t('t_enter_code')}
            </p>
          </div>

          {/* Verify Button */}
          <Button
            onClick={verifyOtp}
            disabled={isPending || !isOtpCompleted}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {t('t_verifying')}
              </>
            ) : (
              <>{isSignUp ? t('t_verify_email_btn') : t('t_sign_in_btn')}</>
            )}
          </Button>

          {/* Resend Code */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('t_no_code')}</p>
            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={isPending || resendCooldown > 0}
              className="text-primary hover:text-primary/80"
            >
              {resendCooldown > 0
                ? `${t('t_resend_in')} ${resendCooldown}s`
                : t('t_resend_code')}
            </Button>
          </div>

          {/* Back to log */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push(paths.login)}
              disabled={isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('t_back_to_login')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
