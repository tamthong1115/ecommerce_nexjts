import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

interface DupItem {
  value: string;
  keys: { domain: string; fullKey: string }[];
}

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

function walkValues(obj: Record<string, unknown>, domain: string, prefix = '', map: Map<string, { domain: string; fullKey: string }[]>) {
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      const normalized = v.trim().toLowerCase();
      if (normalized.length > 1 && !/^[0-9]+$/.test(normalized)) {
        const list = map.get(normalized) || [];
        list.push({ domain, fullKey });
        map.set(normalized, list);
      }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      walkValues(v as Record<string, unknown>, domain, fullKey, map);
    }
  }
}

export function runI18nDupes(locale = 'vi'): DupItem[] {
  const dir = path.join(MESSAGES_DIR, locale);
  const files = getJsonFiles(dir);
  const valueMap = new Map<string, { domain: string; fullKey: string }[]>();

  for (const file of files) {
    const rel = path.relative(dir, file).replace(/\\/g, '/');
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf-8'));
      walkValues(json, rel, '', valueMap);
    } catch {}
  }

  const dupes: DupItem[] = [];
  for (const [val, list] of valueMap.entries()) {
    if (list.length > 1) {
      dupes.push({ value: val, keys: list });
    }
  }

  dupes.sort((a, b) => b.keys.length - a.keys.length);
  return dupes;
}

if (process.argv[1]?.includes('i18n-dupes')) {
  const dupes = runI18nDupes('vi');
  console.log(`Found ${dupes.length} duplicate content clusters in [vi]:`);
  for (const d of dupes.slice(0, 15)) {
    console.log(`\n- "${d.value}" (used in ${d.keys.length} places):`);
    for (const k of d.keys) {
      console.log(`    ${k.domain} -> ${k.fullKey}`);
    }
  }
}

