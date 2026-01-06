import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { $Enums } from '@/lib/generated/prisma';
import IntentStatus = $Enums.IntentStatus;
import { ResponseFactory } from '@/lib/api-response';
import { customerPaidOrderSuccessUsecase } from '@/features/payment_transaction/payment_transaction.usecases';
import PaymentStatus = $Enums.PaymentStatus;
import PaymentProvider = $Enums.PaymentProvider;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.SECRET_WEBHOOK_STRIPE!;

export async function POST(req: NextRequest) {
  const body = await req.text();

  //Kiểm tra chữ kí
  const sig = req.headers.get('stripe-signature');
  if (!sig)
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({ message: 'No signature', code: 400 })
    );
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        if (!session.metadata || Object.keys(session.metadata).length === 0) {
          return NextResponse.json(
            { message: 'metadata is empty or missing' },
            { status: 400 }
          );
        }
        const orderId = session.metadata.orderId;

        if (!orderId) {
          console.error('❌ Error: orderId missing in metadata');
          break;
        }
        const orderIds = orderId.split(',');

        const payment = await prisma.payment.findFirst({
          where: {
            externalId: session.payment_intent as string,
            provider: PaymentProvider.STRIPE,
          },
          include: {
            orders: {
              include: {
                order: true,
              },
            },
          },
        });

        if (!payment) {
          return ResponseFactory.toNextResponse(
            ResponseFactory.error({
              message: 'No payment transaction in progress',
            })
          );
        }

        if (payment.status !== PaymentStatus.PENDING) {
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
          });
        }

        const orderDetails = payment.orders.map((od) => od.order);

        await prisma.$transaction(async (tx) => {
          const updateResult = await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: PaymentStatus.PENDING,
            },
            data: {
              status: PaymentStatus.PAID,
              updatedAt: new Date(),
            },
          });

          if (updateResult.count === 0) {
            console.log(
              `Duplicate webhook detected for Payment ${payment.id}. Ignoring.`
            );
            return;
          }

          await tx.paymentIntent.update({
            where: { gatewayRef: session.payment_intent as string },
            data: {
              status: IntentStatus.SUCCEEDED,
            },
          });

          await tx.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
              paymentStatus: 'PAID',
              status: 'PROCESSING',
              updatedAt: new Date(),
            },
          });

          for (const order of orderDetails) {
            await customerPaidOrderSuccessUsecase(
              order.shopId!,
              order.grandTotal,
              order.id,
              payment.id,
              session.payment_intent as string
            );
          }
        });
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderIds = session.metadata?.orderId?.split(',');
        if (orderIds) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.updateMany({
              where: { externalId: session.payment_intent as string },
              data: { status: 'FAILED' },
            });
            await tx.paymentIntent.updateMany({
              where: { gatewayRef: session.id },
              data: { status: IntentStatus.EXPIRED }, // Hoặc FAILED
            });
            await tx.order.updateMany({
              where: { id: { in: orderIds } },
              data: { paymentStatus: 'FAILED' },
            });
          });
        }
        break;
      }
    }

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: { received: true }, code: 200 })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(
      ResponseFactory.error({
        message: `Webhook Error: ${err}`,
        code: 400,
      })
    );
  }
}
