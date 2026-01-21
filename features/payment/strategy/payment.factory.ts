// src/features/payment/payment.factory.ts
import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import { IPaymentStrategy } from '@/features/payment/strategy/payment.interface';
import { StripeStrategy } from '@/features/payment/strategy/stripe.strategy';
import { VnPayStrategy } from '@/features/payment/strategy/vnpay.strategy';
import { MomoStrategy } from '@/features/payment/strategy/momo.strategy';

export function createPaymentStrategy(
  provider: PaymentProvider
): IPaymentStrategy<any> {
  switch (provider) {
    case PaymentProvider.STRIPE:
      return new StripeStrategy();
    case PaymentProvider.VNPAY:
      return new VnPayStrategy();
    case PaymentProvider.MOMO:
      return new MomoStrategy();
    default:
      throw new Error('Unsupported payment provider');
  }
}
