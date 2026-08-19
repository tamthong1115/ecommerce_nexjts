import { prisma } from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/ecrypt-secret';
import {
  EmailSettingsPublicDTO,
  UpdateEmailSettingsDTO,
} from '@/features/system-settings/server/system-settings.dto';
import { EmailProviderType, SystemSettingKeys } from './system-settings.keys';
import { env } from '@/lib/env';

type SettingValue = string | number | boolean | Record<string, unknown> | null;

export async function getSetting<T = SettingValue>(
  key: string
): Promise<T | null> {
  const row = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!row) return null;

  let value: any = row.value;

  if (row.isSecret && typeof value === 'string') {
    value = decryptSecret(value);
  }

  return value as T;
}

// Raw read (no decrypt) to avoid secret leakage in “public” responses
export async function getSettingRaw(key: string) {
  return prisma.systemSetting.findUnique({
    where: { key },
    select: {
      key: true,
      value: true,
      isSecret: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function upsertSetting(key: string, value: any, isSecret = false) {
  let storedValue = value;

  if (isSecret && typeof value === 'string') {
    storedValue = encryptSecret(value);
  }

  const result = await prisma.systemSetting.upsert({
    where: { key },
    update: { value: storedValue, isSecret },
    create: { key, value: storedValue, isSecret },
  });

  bustEmailSettingsCache();

  return result;
}

type SettingsCache = {
  at: number;
  data: Record<string, unknown>;
};

let cache: SettingsCache | null = null;

export async function getEmailSettingsCached(ttlMs = 15000) {
  const now = Date.now();

  if (cache && now - cache.at < ttlMs) {
    return cache.data;
  }

  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'email.' } },
    select: { key: true, value: true, isSecret: true },
  });

  const map: Record<string, unknown> = {};

  for (const r of rows) {
    let value = r.value;

    if (r.isSecret && typeof value === 'string') {
      value = decryptSecret(value);
    }

    map[r.key] = value;
  }

  cache = {
    at: now,
    data: map,
  };

  return map;
}

export function bustEmailSettingsCache() {
  cache = null;
}

// Public-safe for manager UI: never decrypt/return secrets
export async function getEmailSettingsPublic(): Promise<EmailSettingsPublicDTO> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'email.' } },
    select: { key: true, value: true, isSecret: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const providerRow = byKey.get(SystemSettingKeys.Email.Provider);
  const fromRow = byKey.get(SystemSettingKeys.Email.From);
  const smtpHostRow = byKey.get(SystemSettingKeys.Email.Smtp.Host);
  const smtpPortRow = byKey.get(SystemSettingKeys.Email.Smtp.Port);
  const smtpUserRow = byKey.get(SystemSettingKeys.Email.Smtp.User);
  const smtpPassRow = byKey.get(SystemSettingKeys.Email.Smtp.Pass);
  const resendKeyRow = byKey.get(SystemSettingKeys.Email.Resend.ApiKey);
  const provider = (providerRow?.value as EmailProviderType) ?? 'mock';
  return {
    provider,
    from: (fromRow?.value as string) ?? null,
    smtp: {
      host: (smtpHostRow?.value as string) ?? null,
      port: smtpPortRow?.value != null ? Number(smtpPortRow.value) : null,
      user: (smtpUserRow?.value as string) ?? null,
      hasPass: !!smtpPassRow?.value,
    },
    resend: {
      hasApiKey: !!resendKeyRow?.value,
    },
  };
}
export async function updateEmailSettings(input: UpdateEmailSettingsDTO) {
  if (input.provider) {
    await upsertSetting(
      SystemSettingKeys.Email.Provider,
      input.provider,
      false
    );
  }
  if (input.from) {
    await upsertSetting(SystemSettingKeys.Email.From, input.from, false);
  }
  if (input.smtp?.host)
    await upsertSetting(
      SystemSettingKeys.Email.Smtp.Host,
      input.smtp.host,
      false
    );
  if (input.smtp?.port != null)
    await upsertSetting(
      SystemSettingKeys.Email.Smtp.Port,
      input.smtp.port,
      false
    );
  if (input.smtp?.user)
    await upsertSetting(
      SystemSettingKeys.Email.Smtp.User,
      input.smtp.user,
      false
    );
  // Secrets: only update when provided
  if (input.smtp?.pass)
    await upsertSetting(
      SystemSettingKeys.Email.Smtp.Pass,
      input.smtp.pass,
      true
    );
  if (input.resend?.apiKey)
    await upsertSetting(
      SystemSettingKeys.Email.Resend.ApiKey,
      input.resend.apiKey,
      true
    );

}
export type EffectiveEmailConfig = {
  provider: EmailProviderType;
  from: string;
  smtp: { host: string; port: number; user: string; pass: string };
  resend: { apiKey: string };
};
// Internal runtime config (DB overrides env; env is fallback)
export async function getEffectiveEmailConfig(): Promise<EffectiveEmailConfig> {
  const s = await getEmailSettingsCached();
  const webName = env.NEXT_PUBLIC_WEB_NAME || 'App';
  const provider =
    (s[SystemSettingKeys.Email.Provider] as EmailProviderType) || 'mock';
  const from =
    (s[SystemSettingKeys.Email.From] as string) ||
    env.EMAIL_FROM ||
    `${webName} <no-reply@yourdomain.com>`;
  const smtpHost =
    (s[SystemSettingKeys.Email.Smtp.Host] as string) ||
    env.EMAIL_SMTP_HOST ||
    '';
  const smtpPort = Number(
    (s[SystemSettingKeys.Email.Smtp.Port] as any) ?? env.EMAIL_SMTP_PORT ?? 587
  );
  const smtpUser =
    (s[SystemSettingKeys.Email.Smtp.User] as string) ||
    env.EMAIL_SMTP_USER ||
    '';
  const smtpPass =
    (s[SystemSettingKeys.Email.Smtp.Pass] as string) ||
    env.EMAIL_SMTP_PASS ||
    '';
  const resendApiKey =
    (s[SystemSettingKeys.Email.Resend.ApiKey] as string) ||
    env.RESEND_API_KEY ||
    '';
  return {
    provider,
    from,
    smtp: { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass },
    resend: { apiKey: resendApiKey },
  };
}
