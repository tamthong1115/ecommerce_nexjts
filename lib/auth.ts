import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from './env';
import { admin, emailOTP } from 'better-auth/plugins';

import { headers } from 'next/headers';
import { nextCookies } from 'better-auth/next-js';
import { getUserNameOrEmailPrefix } from '@/lib/utils';
import { sendNotification } from '@/features/notification/server/controller/notification.action';

import { ChannelType } from '@/features/notification/types/notification.type';
import { devConfig } from './dev-config';
import { $Enums, NotificationType } from '@prisma/client';
import NotificationRole = $Enums.NotificationRole;
import { prisma } from '@/lib/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  socialProviders: {
    github: {
      clientId: env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    },
    google: {
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendNotification({
        to: user.email,
        recipientRole: NotificationRole.BUYER,
        type: NotificationType.SECURITY,
        channels: [ChannelType.EMAIL],
        subject: 'Reset your password',
        body: 'A password reset was requested for your account.',
        metadata: {
          userName: getUserNameOrEmailPrefix(user),
          resetLink: url,
          ipAddress: request?.headers.get('x-forwarded-for') || 'Unknown',
        },
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.$transaction(async (tx) => {
            await tx.userProfile.upsert({
              where: { userId: user.id },
              update: {},
              create: { userId: user.id, emailForBill: user.email ?? null },
            });
            await tx.cart.upsert({
              where: { userId: user.id },
              update: {},
              create: { userId: user.id },
            });
            await tx.wishlist.upsert({
              where: { userId: user.id },
              update: {},
              create: { userId: user.id },
            });
          });
        },
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {

        if (devConfig.mockEmails) {
          console.log('Verification OTP:', otp);
          return;
        }
        await sendNotification({
          to: email,
          recipientRole: NotificationRole.BUYER,
          type: NotificationType.VERIFICATION,
          channels: [ChannelType.EMAIL],
          subject: 'Verify your email address',
          body: `Your verification code is ${otp}`,
          metadata: {
            otp: otp,
            validityInMinutes: 5,
          },
        });
      },
      allowedAttempts: 5,
      expiresIn: 300, // 5 minutes
    }),
    admin(),
    nextCookies(),
  ],
  trustedOrigins: [env.NEXT_PUBLIC_BASE_URL],
});

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session ?? null;
}

export async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
}
