import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@/lib/env';
import { IEmailProvider, SendEmailOptions } from '../email-provider.interface';

const webName = env.NEXT_PUBLIC_WEB_NAME;

type SmtpConfig = { host: string; port: number; user: string; pass: string };

export class NodemailerProvider implements IEmailProvider {
  private transporter: Transporter;

  constructor(cfg: SmtpConfig) {
    const { host, port, user, pass } = cfg;
    if (!host || !user || !pass)
      throw new Error('SMTP configuration is missing');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const fromAddress = options.from || `${webName} <no-reply@localhost>`;

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(
        `✅ [Nodemailer] Sent to ${options.to}. Message ID: ${info.messageId}`
      );
    } catch (err) {
      console.error('❌ [Nodemailer] Error:', err);
      throw new Error('Failed to send email via Nodemailer');
    }
  }
}
