import { $Enums } from '@/lib/generated/prisma';
import PaymentProvider = $Enums.PaymentProvider;
import { z } from 'zod';
import PaymentStatus = $Enums.PaymentStatus;
import Currency = $Enums.Currency;

export const CreatePaymentSchema = z.object({
  provider: z.enum(PaymentProvider),
  method: z.string(),
  amount: z.number().positive(),
  status: z.enum(PaymentStatus).default('PENDING'),
  currency: z.enum(Currency),
  externalId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  rawPayload: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export interface StripePaymentParams {
  orderIds: string[];
  amount: number;
  metadata: Record<string, string>;
  idempotencyKey: string;
  origin: string;
}

export interface VnpayPaymentParams {
  amount: number;
  orderIds: string[];
  ipAddr: string;
  draftId: string;
  bankCode: string;
  language: string;
}

export interface MomoPaymentParams {
  amount: number;
  orderIds: string[];
  idempotencyKey: string;
  draftId: string;
  orderInfo: string;
  requestType: string;
  origin: string;
}
