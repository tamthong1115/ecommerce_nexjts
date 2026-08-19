import {
  IEmailProvider,
  SendEmailOptions,
} from '@/features/notification/server/email/email-provider.interface';
import { Resend } from 'resend';

type ResendConfig = { apiKey: string };

export class ResendProvider implements IEmailProvider {
  private client: Resend;

  constructor(cfg: ResendConfig) {
    if (!cfg.apiKey) throw new Error('Resend API key is missing');
    this.client = new Resend(cfg.apiKey);
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const result = await this.client.emails.send({
      from: options.from!,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if ((result as any).error) {
      throw new Error('Failed to send email via Resend');
    }
  }
}
