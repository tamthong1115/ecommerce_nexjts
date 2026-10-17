import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { locales } from '@/i18n/config';
import { deepSet } from '@/lib/i18n/build';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

export async function exportDbToJson(): Promise<number> {
  const publishedValues = await prisma.translationValue.findMany({
    where: {
      status: 'PUBLISHED',
      key: { status: 'ACTIVE' },
    },
    include: {
      key: true,
    },
  });

  const filesToUpdate = new Map<string, Record<string, any>>();

  for (const pv of publishedValues) {
    const filePath = path.join(MESSAGES_DIR, pv.locale, `${pv.key.namespace}.json`);
    let data = filesToUpdate.get(filePath);

    if (!data) {
      if (fs.existsSync(filePath)) {
        try {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
          data = {};
        }
      } else {
        data = {};
      }
      filesToUpdate.set(filePath, data || {});
    }

    const safeData = data || {};
    const parts = pv.key.key.split('.');
    deepSet(safeData, parts, pv.value);
  }

  let count = 0;
  for (const [filePath, data] of filesToUpdate.entries()) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    count++;
  }

  console.log(`✅ Exported published translations back to ${count} JSON files in messages/.`);
  return count;
}

if (process.argv[1]?.includes('i18n-export')) {
  exportDbToJson()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Export failed:', err);
      process.exit(1);
    });
}

