import fs from 'node:fs';
import path from 'node:path';

interface CheckIssue {
  type: 'MISMATCH_KEY' | 'DUPLICATE_KEY';
  message: string;
  details?: Record<string, unknown>;
}

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

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

export function runI18nCheck(): { issues: CheckIssue[]; passed: boolean } {
  const issues: CheckIssue[] = [];

  const viFiles = getJsonFiles(path.join(MESSAGES_DIR, 'vi'));
  const enFiles = getJsonFiles(path.join(MESSAGES_DIR, 'en'));

  const viDomains = new Map<string, string[]>();
  const enDomains = new Map<string, string[]>();

  for (const file of viFiles) {
    const rel = path.relative(path.join(MESSAGES_DIR, 'vi'), file).replace(/\\/g, '/');
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      viDomains.set(rel, flattenKeys(content));
    } catch (e) {
      issues.push({ type: 'MISMATCH_KEY', message: `Invalid JSON in ${file}: ${(e as Error).message}` });
    }
  }

  for (const file of enFiles) {
    const rel = path.relative(path.join(MESSAGES_DIR, 'en'), file).replace(/\\/g, '/');
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      enDomains.set(rel, flattenKeys(content));
    } catch (e) {
      issues.push({ type: 'MISMATCH_KEY', message: `Invalid JSON in ${file}: ${(e as Error).message}` });
    }
  }

  // Check file presence
  for (const rel of viDomains.keys()) {
    if (!enDomains.has(rel)) {
      issues.push({ type: 'MISMATCH_KEY', message: `File exists in vi but missing in en: ${rel}` });
    }
  }
  for (const rel of enDomains.keys()) {
    if (!viDomains.has(rel)) {
      issues.push({ type: 'MISMATCH_KEY', message: `File exists in en but missing in vi: ${rel}` });
    }
  }

  // Check key mismatches across matching files
  for (const [rel, viKeys] of viDomains.entries()) {
    const enKeys = enDomains.get(rel);
    if (!enKeys) continue;

    const viSet = new Set(viKeys);
    const enSet = new Set(enKeys);

    for (const vk of viKeys) {
      if (!enSet.has(vk)) {
        issues.push({
          type: 'MISMATCH_KEY',
          message: `Key "${vk}" in domain "${rel}" exists in vi but missing in en`,
        });
      }
    }
    for (const ek of enKeys) {
      if (!viSet.has(ek)) {
        issues.push({
          type: 'MISMATCH_KEY',
          message: `Key "${ek}" in domain "${rel}" exists in en but missing in vi`,
        });
      }
    }
  }

  return {
    issues,
    passed: issues.length === 0,
  };
}

if (process.argv[1]?.includes('i18n-check')) {
  const result = runI18nCheck();
  if (result.passed) {
    console.log('✅ i18n check passed: vi and en keys are consistent across all domains.');
    process.exit(0);
  } else {
    console.error(`❌ i18n check failed with ${result.issues.length} issue(s):`);
    for (const iss of result.issues) {
      console.error(`- [${iss.type}] ${iss.message}`);
    }
    process.exit(1);
  }
}

