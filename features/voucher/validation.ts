import { z } from 'zod';
import { $Enums } from '@/lib/generated/prisma';
import VoucherType = $Enums.VoucherType;
import Currency = $Enums.Currency;

export const createVoucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((val) => val.toUpperCase())
      .pipe(
        z
          .string()
          .length(11)
          .startsWith('VC-')
          .regex(/^VC-[A-Z0-9]{8}$/)
      ),

    type: z.enum(VoucherType, {
      error: 'Loại voucher không hợp lệ',
    }),

    value: z
      .number({ error: 'Giá trị giảm phải là số' })
      .positive('Giá trị giảm phải lớn hơn 0'),

    maxDiscount: z.number().positive().nullable().optional(),

    minSubtotal: z.number().min(0).nullable().optional(),

    currency: z.enum(Currency).default(Currency.VND),

    startAt: z.coerce.date({ error: 'Ngày bắt đầu là bắt buộc' }),

    endAt: z.coerce.date({
      error: 'Ngày kết thúc là bắt buộc',
    }),

    usageLimit: z.number().int().min(1).nullable().optional(),

    perUserLimit: z.number().int().min(1).nullable().optional(),

    shopId: z.string().uuid('ID Shop không hợp lệ').nullable().optional(),

    isActive: z.boolean().default(true),

    productIds: z.array(z.string().uuid()).optional(),

    categoryIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    // Kiểm tra ngày tháng
    if (data.endAt <= data.startAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
        path: ['endAt'],
      });
    }

    // Kiểm tra logic loại Voucher
    if (data.type === VoucherType.PERCENT) {
      if (data.value > 100) {
        ctx.addIssue({
          code: 'custom',
          message: 'Giảm giá theo % không được vượt quá 100%',
          path: ['value'],
        });
      }
    }

    // Logic Max Discount (chỉ nên có khi giảm theo %)
    if (data.type === VoucherType.FIXED && data.maxDiscount) {
    }
  });

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
