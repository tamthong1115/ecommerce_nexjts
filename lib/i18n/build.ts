import { prisma } from '@/lib/db';
import { defaultLocale, type Locale, locales } from '@/i18n/config';
import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

export async function loadBaseFromJson(locale: Locale): Promise<Record<string, unknown>> {
  const dir = path.join(MESSAGES_DIR, locale);
  if (!fs.existsSync(dir)) {
    return {};
  }

  const results: Record<string, unknown> = {};

  function scan(currentDir: string) {
    const list = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        scan(fullPath);
      } else if (item.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          Object.assign(results, content);
        } catch (e) {
          console.warn(`[i18n] Failed to parse JSON at ${fullPath}:`, e);
        }
      }
    }
  }

  scan(dir);
  return results;
}

export function deepSet(obj: Record<string, any>, pathKeys: string[], value: any) {
  let curr = obj;
  for (let i = 0; i < pathKeys.length - 1; i++) {
    const k = pathKeys[i];
    if (!curr[k] || typeof curr[k] !== 'object' || Array.isArray(curr[k])) {
      curr[k] = {};
    }
    curr = curr[k];
  }
  curr[pathKeys[pathKeys.length - 1]] = value;
}

export async function buildMessages(locale: Locale): Promise<Record<string, unknown>> {
  const base = await loadBaseFromJson(locale);

  // Read PUBLISHED values from DB
  const publishedValues = await prisma.translationValue.findMany({
    where: {
      locale,
      status: 'PUBLISHED',
      value: { not: '' },
    },
    include: {
      key: true,
    },
  });

  const merged = JSON.parse(JSON.stringify(base));

  for (const pv of publishedValues) {
    if (pv.key.status === 'DEPRECATED') continue;
    const parts = pv.key.key.split('.');
    deepSet(merged, parts, pv.value);
  }

  return merged;
}

