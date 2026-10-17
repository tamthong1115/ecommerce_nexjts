import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

function deepSet(obj: Record<string, any>, pathKeys: string[], value: any) {
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

function deepGet(obj: Record<string, any>, pathKeys: string[]): any {
  let curr = obj;
  for (const k of pathKeys) {
    if (!curr || typeof curr !== 'object') return undefined;
    curr = curr[k];
  }
  return curr;
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

function flattenKeys(obj: Record<string, any>, prefix = ''): { key: string; value: any }[] {
  const keys: { key: string; value: any }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

export function alignKeys() {
  const viFiles = getJsonFiles(path.join(MESSAGES_DIR, 'vi'));

  for (const viFile of viFiles) {
    const rel = path.relative(path.join(MESSAGES_DIR, 'vi'), viFile);
    const enFile = path.join(MESSAGES_DIR, 'en', rel);

    if (!fs.existsSync(enFile)) {
      fs.mkdirSync(path.dirname(enFile), { recursive: true });
      fs.writeFileSync(enFile, fs.readFileSync(viFile, 'utf-8'));
      continue;
    }

    const viJson = JSON.parse(fs.readFileSync(viFile, 'utf-8'));
    const enJson = JSON.parse(fs.readFileSync(enFile, 'utf-8'));

    const viFlats = flattenKeys(viJson);
    const enFlats = flattenKeys(enJson);

    let enChanged = false;
    let viChanged = false;

    // Fill missing keys in en from vi
    for (const item of viFlats) {
      const parts = item.key.split('.');
      if (deepGet(enJson, parts) === undefined) {
        deepSet(enJson, parts, item.value);
        enChanged = true;
      }
    }

    // Fill missing keys in vi from en
    for (const item of enFlats) {
      const parts = item.key.split('.');
      if (deepGet(viJson, parts) === undefined) {
        deepSet(viJson, parts, item.value);
        viChanged = true;
      }
    }

    if (enChanged) {
      fs.writeFileSync(enFile, JSON.stringify(enJson, null, 2) + '\n', 'utf-8');
    }
    if (viChanged) {
      fs.writeFileSync(viFile, JSON.stringify(viJson, null, 2) + '\n', 'utf-8');
    }
  }
}

alignKeys();
console.log('✅ Synchronized and aligned all translation keys between vi and en.');

