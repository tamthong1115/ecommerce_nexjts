import type { EmailProviderType } from './system-settings.keys';
import { z } from 'zod';

export const EmailProviderSchema = z.enum([
  'smtp',
  'resend',
  'mock',
]) satisfies z.ZodType<EmailProviderType>;

export const UpdateEmailSettingsSchema = z.object({
  provider: EmailProviderSchema.optional(),
  from: z.string().min(3).optional(),
  smtp: z
    .object({
      host: z.string().min(1).optional(),
      port: z.coerce.number().int().min(1).max(65535).optional(),
      user: z.string().min(1).optional(),
      pass: z.string().min(1).optional(),
    })
    .optional(),
  resend: z
    .object({
      apiKey: z.string().min(1).optional(),
    })
    .optional(),
});

export type UpdateEmailSettingsDTO = z.infer<typeof UpdateEmailSettingsSchema>;

export type EmailSettingsPublicDTO = {
  provider: EmailProviderType;
  from: string | null;
  smtp: {
    host: string | null;
    port: number | null;
    user: string | null;
    hasPass: boolean;
  };
  resend: {
    hasApiKey: boolean;
  };
};
