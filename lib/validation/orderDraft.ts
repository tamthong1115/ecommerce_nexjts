import { z } from 'zod';

export const createOrderDraftSchema = z.object({
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.uuid(),
      variantId: z.uuid(),
      quantity: z.number().min(1),
    })
  ),
  voucher: z.array(z.object({ code: z.string() })),

  currency: z.enum(['VND', 'USD']).optional(),
});
