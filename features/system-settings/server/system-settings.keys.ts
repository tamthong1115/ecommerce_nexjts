export const SystemSettingKeys = {
  Email: {
    Provider: 'email_provider',
    From: 'email_from',
    Smtp: {
      Host: 'email.smtp.host',
      Port: 'email.smtp.port',
      User: 'email.smtp.user',
      Pass: 'email.smtp.pass',
    },
    Resend: {
      ApiKey: 'email.resend.apiKey',
    },
  },
} as const;

export type EmailProviderType = 'smtp' | 'resend' | 'mock';
