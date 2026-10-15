import { z } from 'zod';

export const GetOrderStatsSchema = z.object({
  shopId: z.string().optional().or(z.literal('all')),
  days: z.coerce.number().min(1).max(365).default(90),
});

export type GetOrderStatsInput = z.infer<typeof GetOrderStatsSchema>;

export interface OrderStatsResult {
  date: string;
  totalOrders: number;
  revenue: number;
}
