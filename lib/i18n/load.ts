import { redisClient } from '@/lib/redis';
import { type Locale } from '@/i18n/config';
import { loadBaseFromJson } from './build';

interface CachedEntry {
  version: string | null;
  messages: Record<string, unknown>;
}

const memoryCache = new Map<Locale, CachedEntry>();

export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  let version: string | null = null;

  if (redisClient) {
    try {
      version = await redisClient.get('i18n:version');
    } catch {
      version = null;
    }
  }

  const hit = memoryCache.get(locale);
  if (hit && hit.version === version && version !== null) {
    return hit.messages;
  }

  let messages: Record<string, unknown> | null = null;

  if (version !== null && redisClient) {
    try {
      const raw = await redisClient.get(`i18n:messages:${locale}`);
      if (raw) {
        messages = JSON.parse(raw);
      }
    } catch {
      messages = null;
    }
  }

  if (!messages) {
    messages = await loadBaseFromJson(locale);
  }

  memoryCache.set(locale, {
    version,
    messages,
  });

  return messages;
}

export function clearMemoryI18nCache() {
  memoryCache.clear();
}

