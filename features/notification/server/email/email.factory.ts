import { IEmailProvider } from './email-provider.interface';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { MockEmailProvider } from './providers/mock.provider';

let emailProviderInstance: IEmailProvider | null = null;

export class EmailProviderFactory {
  // static getProvider(): IEmailProvider {
  //   if (emailProviderInstance) {
  //     return emailProviderInstance;
  //   }

  //   if (
  //     process.env.NODE_ENV === 'development' &&
  //     process.env.FORCE_SMTP !== 'true'
  //   ) {
  //     emailProviderInstance = new MockEmailProvider();
  //   } else {
  //     emailProviderInstance = new NodemailerProvider();
  //   }

  //   return emailProviderInstance;
  // }
  

}
