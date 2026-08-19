import { getEffectiveEmailConfig } from '@/features/system-settings/server/system-settings.service';
import { MockEmailProvider } from '@/features/notification/server/email/providers/mock.provider';
import { NodemailerProvider } from '@/features/notification/server/email/providers/nodemailer.provider';
import { ResendProvider } from '@/features/notification/server/email/providers/resend.provider';

export async function resolveEmailProvider() {
  const cfg = await getEffectiveEmailConfig();
  if (cfg.provider === 'smtp') {
    return { from: cfg.from, provider: new NodemailerProvider(cfg.smtp) };
  }
  if (cfg.provider === 'resend') {
    return { from: cfg.from, provider: new ResendProvider(cfg.resend) };
  }
  return { from: cfg.from, provider: new MockEmailProvider() };
}
