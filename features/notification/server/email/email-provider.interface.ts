export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
