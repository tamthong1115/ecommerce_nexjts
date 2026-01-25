import { IPaymentStrategy } from './payment.interface';
import { Stripe } from 'stripe';
import { StripePaymentParams } from '@/features/payment/payment.dto';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class StripeStrategy implements IPaymentStrategy<StripePaymentParams> {
  async createPaymentUrl(params: StripePaymentParams) {
    const { amount, metadata, idempotencyKey, origin, orderIds } = params;

    //Tạo session stripe payment
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${origin}/success`,
        cancel_url: `${origin}/cancel`,
        metadata: metadata,
        payment_intent_data: {
          transfer_group: metadata.orderId,
          metadata: metadata,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Thanh toán ${orderIds.length} đơn hàng`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
      },
      { idempotencyKey: idempotencyKey }
    );

    return {
      url: session.url!,
      externalId: session.id,
      rawPayload: {
        id: session.id,
        url: session.url,
        payment_status: session.payment_status,
        amount_total: amount,
        metadata: session.metadata,
        provider: 'STRIPE',
      },
    };
  }
}
