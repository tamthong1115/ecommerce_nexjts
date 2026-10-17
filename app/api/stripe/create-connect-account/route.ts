import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { auth, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!user)
    return NextResponse.json({ message: 'User not found' }, { status: 404 });

  if (!user.emailForBill || !user.phone || !session.user.name) {
    return NextResponse.json(
      {
        error: 'MISSING_PROFILE',
        message: 'Please update your profile information first.',
      },
      { status: 403 }
    );
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, stripeAccount: true },
    });

    let accountId = dbUser?.stripeAccount;
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
      } catch {
        accountId = null;
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeAccount: accountId,
        ...(dbUser?.role !== 'admin' ? { role: 'seller' } : {}),
      },
    });

    const reqHeaders = await headers();
    const origin =
      reqHeaders.get('origin') ||
      (reqHeaders.get('host')
        ? `${reqHeaders.get('x-forwarded-proto') || 'http'}://${reqHeaders.get('host')}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/signup-business`,
      return_url: `${origin}/seller/shops/create`,
      type: 'account_onboarding',
    });

    return NextResponse.json(
      { id: accountId, url: accountLink.url },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error occurred';
    console.error('Stripe onboarding error:', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
