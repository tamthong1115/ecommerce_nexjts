import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { locales } from '@/i18n/config';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

function getJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getJsonFiles(fullPath));
    } else if (item.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function flattenEntries(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
  const results: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      results.push(...flattenEntries(v, fullKey));
    } else if (typeof v === 'string') {
      results.push({ key: fullKey, value: v });
    }
  }
  return results;
}

function extractParams(value: string): string[] {
  const matches = value.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
}

export async function syncJsonToDb(): Promise<{ keysSynced: number; valuesSynced: number }> {
  let keysSynced = 0;
  let valuesSynced = 0;

  const viDir = path.join(MESSAGES_DIR, 'vi');
  const viFiles = getJsonFiles(viDir);

  for (const file of viFiles) {
    const rel = path.relative(viDir, file).replace(/\\/g, '/');
    const namespace = rel.replace(/\.json$/, '');
    const isShared = namespace === 'main/common' || namespace === 'manager/general';

    const viJson = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const viEntries = flattenEntries(viJson);

    for (const entry of viEntries) {
      const params = extractParams(entry.value);

      const tKey = await prisma.translationKey.upsert({
        where: {
          namespace_key: {
            namespace,
            key: entry.key,
          },
        },
        create: {
          namespace,
          key: entry.key,
          source: 'CODE',
          status: 'ACTIVE',
          tier: isShared ? 'SHARED' : 'FEATURE',
          params,
        },
        update: {
          status: 'ACTIVE',
          tier: isShared ? 'SHARED' : 'FEATURE',
          params,
        },
      });

      keysSynced++;

      for (const loc of locales) {
        const locFile = path.join(MESSAGES_DIR, loc, rel);
        let locVal = entry.value;

        if (fs.existsSync(locFile)) {
          try {
            const locJson = JSON.parse(fs.readFileSync(locFile, 'utf-8'));
            const parts = entry.key.split('.');
            let curr = locJson;
            for (const p of parts) {
              if (curr && typeof curr === 'object') {
                curr = curr[p];
              } else {
                curr = undefined;
                break;
              }
            }
            if (typeof curr === 'string') {
              locVal = curr;
            }
          } catch {}
        }

        await prisma.translationValue.upsert({
          where: {
            keyId_locale: {
              keyId: tKey.id,
              locale: loc,
            },
          },
          create: {
            keyId: tKey.id,
            locale: loc,
            value: locVal,
            baseValue: locVal,
            publishedValue: locVal,
            status: 'PUBLISHED',
          },
          update: {
            baseValue: locVal,
          },
        });

        valuesSynced++;
      }
    }
  }

  return { keysSynced, valuesSynced };
}

if (process.argv[1]?.includes('i18n-sync')) {
  syncJsonToDb()
    .then(({ keysSynced, valuesSynced }) => {
      console.log(`✅ Synced ${keysSynced} keys and ${valuesSynced} values to DB.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Sync failed:', err);
      process.exit(1);
    });
}

