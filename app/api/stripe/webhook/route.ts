import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { $Enums } from '@/lib/generated/prisma';
import { ResponseFactory } from '@/lib/api-response';
import { paymentHookQueue } from '@/worker/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.SECRET_WEBHOOK_STRIPE!;

export async function POST(req: NextRequest) {
  const body = await req.text();

  //Kiểm tra chữ kí
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({ message: 'No signature', code: 400 })
    );
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      // 3. Đẩy vào Queue
      await paymentHookQueue().add(
        'process-webhook',
        {
          provider: $Enums.PaymentProvider.STRIPE,
          eventType: event.type,
          payload: event.data.object,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        }
      );
    }

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: { received: true }, code: 200 })
    );
  } catch (err) {
    console.error('--> Lỗi update Intent:', err);
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: `Webhook Error: ${err}`,
        code: 500,
      })
    );
  }
}
