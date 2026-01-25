import { IEmailProvider, SendEmailOptions } from '../email-provider.interface';

export class MockEmailProvider implements IEmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    console.log('----------------------------------------------');
    console.log(`📧 MOCK EMAIL SENT`);
    console.log(`TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log('----------------------------------------------');

    console.log(`HTML CONTENT:\n${options.html}`);
  }
}
