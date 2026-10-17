import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { config } from 'dotenv';

// Only load .env if we are NOT in a Next.js environment (to avoid conflicts)
if (process.env.NEXT_RUNTIME === undefined) {
  config();
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    PUSHER_APP_ID: z.string().min(1),
    PUSHER_KEY: z.string().min(1),
    PUSHER_SECRET: z.string().min(1),
    PUSHER_CLUSTER: z.string().min(1),
    EMAIL_SMTP_HOST: z.string().min(1),
    EMAIL_SMTP_PORT: z.string().min(1),
    EMAIL_SMTP_USER: z.string().min(1),
    EMAIL_SMTP_PASS: z.string().min(1),
    REDIS_URL: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1),
    SETTINGS_ENCRYPTION_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().optional(),
    SECRET_WEBHOOK_STRIPE: z.string().optional(),
    VNPAY_TERMINAL_ID: z.string().optional(),
    VNPAY_SECRET_KEY: z.string().optional(),
    VNPAY_URL: z.string().optional(),
    VNPAY_API: z.string().optional(),
    VNPAY_RETURN_URL: z.string().optional(),
    MOMO_PARTNER_CODE: z.string().optional(),
    MOMO_ACCESS_KEY: z.string().optional(),
    MOMO_SECRET_KEY: z.string().optional(),
    MOMO_API_END_POINT: z.string().optional(),
    RECOMMEND_BASE_URL: z.string().optional(),
    FORCE_SMTP: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_WEB_NAME: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    NEXT_PUBLIC_PUSHER_KEY: z.string().min(1),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1),
    NEXT_PUBLIC_ADDRESS_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_STORAGE_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_MOCK_OTP: z.string().optional(),
    NEXT_PUBLIC_MOCK_EMAILS: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_WEB_NAME: process.env.NEXT_PUBLIC_WEB_NAME,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    NEXT_PUBLIC_ADDRESS_BASE_URL: process.env.NEXT_PUBLIC_ADDRESS_BASE_URL,
    NEXT_PUBLIC_STORAGE_DOMAIN: process.env.NEXT_PUBLIC_STORAGE_DOMAIN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MOCK_OTP: process.env.NEXT_PUBLIC_MOCK_OTP,
    NEXT_PUBLIC_MOCK_EMAILS: process.env.NEXT_PUBLIC_MOCK_EMAILS,
  },
});
