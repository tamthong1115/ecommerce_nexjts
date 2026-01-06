'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { fetchApi } from '@/lib/client-fetch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { v4 } from 'uuid';

export const PaymentClient = ({ draftId }: { draftId: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('checkout_page.payment_client');
  const [paymentProvider, setPaymentProvider] = useState('COD');
  const [bankCode, setBankCode] = useState<string>('');

  console.log('payment: ' + draftId);
  let urlPath = '/api/checkout';
  switch (paymentProvider) {
    case 'COD':
      urlPath = urlPath + '/cod';
      break;
    case 'STRIPE':
      urlPath = urlPath + '/stripe';
      break;
    case 'VNPAY':
      urlPath = urlPath + '/vnpay';
      break;
    case 'MOMO':
      urlPath = urlPath + '/momo';
      break;
    default:
      urlPath = urlPath + '/cod';
  }

  const handlePayment = async () => {
    if (paymentProvider === 'VNPAY' && !bankCode) {
      toast.error('Vui lòng chọn phương thức thanh toán VNPAY (QR, Thẻ...)');
      return;
    }
    try {
      const idenpotencyKey = v4();
      setIsLoading(true);
      const res = await fetchApi<{ url: string }>(urlPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          body: {
            bankCode: paymentProvider === 'VNPAY' ? bankCode : '',
            language: 'vn',
            idenpotencyKey: idenpotencyKey,
          },
        }),
      });

      if (!res.success) {
        throw new Error(
          res.errors!.toString() || t('t_payemnt_session_failed')
        );
      }

      if (res.data!.url) {
        toast.success(t('t_payment_direct'), {
          position: 'top-right',
          duration: 3000,
        });
        window.location.href = res.data!.url;
      }
    } catch (err) {
      toast.error(t('t_payment_create_session_failed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col my-4 gap-2">
        <h2>Choose payment method</h2>
        <Label
          htmlFor="payment_provider"
          className={`flex items-center gap-3 py-2 px-4 border rounded-xl cursor-pointer
          ${paymentProvider === 'COD' ? 'border-primary bg-primary/5' : 'border-secondary'}
        `}
          onClick={() => setPaymentProvider('COD')}
        >
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentProvider === 'COD'}
            onChange={() => setPaymentProvider('COD')}
            className="accent-primary"
          />

          <Image src="/icon/i_money.png" alt="none" width={40} height={40} />
          <span>Thanh toán khi nhận hàng (COD)</span>
        </Label>
        <Label
          htmlFor="payment_provider"
          className={`flex items-center gap-3 py-2 px-4 border rounded-xl cursor-pointer
          ${paymentProvider === 'STRIPE' ? 'border-primary bg-primary/5' : 'border-secondary'}
        `}
          onClick={() => setPaymentProvider('STRIPE')}
        >
          <input
            type="radio"
            name="payment"
            value="stripe"
            checked={paymentProvider === 'STRIPE'}
            onChange={() => setPaymentProvider('STRIPE')}
            className="accent-primary"
          />

          <Image
            src="/icon/Stripe.avif"
            alt="none"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span>Cổng thanh toán Stripe</span>
        </Label>
        <Label
          htmlFor="payment_provider"
          className={`flex items-center gap-3 py-2 px-4 border rounded-xl cursor-pointer justify-between
          ${paymentProvider === 'VNPAY' ? 'border-primary bg-primary/5' : 'border-secondary'}
        `}
          onClick={() => setPaymentProvider('VNPAY')}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              value="vnpay"
              checked={paymentProvider === 'VNPAY'}
              onChange={() => setPaymentProvider('VNPAY')}
              className="accent-primary"
            />

            <Image
              src="/icon/vnpay.png"
              alt="none"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span>Cổng thanh toán VN Pay</span>
          </div>
          <span
            className={`transition duration-700 ${paymentProvider === 'VNPAY' ? `rotate-180` : null}`}
          >
            ⮝
          </span>
        </Label>
        {paymentProvider === 'VNPAY' && (
          <div className="px-4 pb-4 pt-0 pl-12 animate-in slide-in-from-top-2">
            <p className="text-sm mb-2 text-muted-foreground">
              Chọn phương thức:
            </p>
            <RadioGroup
              value={bankCode}
              onValueChange={setBankCode}
              className="grid grid-cols-1 gap-2"
              defaultValue="VNPAYQR"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VNPAYQR" id="VNPAYQR" />
                <Label htmlFor="VNPAYQR" className="cursor-pointer">
                  Thanh toán qua Ứng dụng hỗ trợ VNPAYQR
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VNBANK" id="VNBANK" />
                <Label htmlFor="VNBANK" className="cursor-pointer">
                  Thẻ ATM / Tài khoản nội địa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INTCARD" id="INTCARD" />
                <Label htmlFor="INTCARD" className="cursor-pointer">
                  Thẻ thanh toán quốc tế
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        <Label
          htmlFor="payment_provider"
          className={`flex items-center gap-3 py-2 px-4 border rounded-xl cursor-pointer
          ${paymentProvider === 'MOMO' ? 'border-primary bg-primary/5' : 'border-secondary'}
        `}
          onClick={() => setPaymentProvider('MOMO')}
        >
          <input
            type="radio"
            name="payment"
            value="momo"
            checked={paymentProvider === 'MOMO'}
            onChange={() => setPaymentProvider('MOMO')}
            className="accent-primary"
          />

          <Image src="/icon/momo.webp" alt="none" width={40} height={40} />
          <span>Ví điện tử Momo</span>
        </Label>
      </div>
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="bg-primary text-primary-foreground cursor-pointer px-4 py-2 rounded-lg w-full"
      >
        {isLoading ? t('t_processing') : t('t_payment')}
      </Button>
    </>
  );
};
