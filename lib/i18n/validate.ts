import { prisma } from '@/lib/db';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const UI_MAX_LENGTHS: Record<string, number> = {
  BUTTON: 24,
  LABEL: 40,
  TITLE: 80,
  MESSAGE: 500,
  ERROR: 250,
  HELP: 300,
};

export async function validateTranslationValue({
  locale,
  value,
  kind = 'MESSAGE',
  maxLength,
  params = [],
  strict = false,
}: {
  locale: string;
  value: string;
  kind?: string;
  maxLength?: number | null;
  params?: string[];
  strict?: boolean;
}): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Empty value
  if (!value || value.trim() === '') {
    errors.push('Translation value cannot be empty');
    return { valid: false, errors, warnings };
  }

  // Check 2: Control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) {
    errors.push('Value contains illegal control characters');
  }

  // Check 3: Raw HTML check (allows only basic inline formatting)
  const tagMatches = value.match(/<\/?[a-zA-Z][^>]*>/g) || [];
  const allowedTags = new Set(['<b>', '</b>', '<i>', '</i>', '<strong>', '</strong>', '<br>', '<br/>', '<link>', '</link>']);
  for (const tag of tagMatches) {
    if (!allowedTags.has(tag.toLowerCase())) {
      errors.push(`Raw HTML tag "${tag}" is forbidden. Only simple safe tags are allowed.`);
    }
  }

  // Check 4: ICU syntax & placeholders
  const extractedParams = (value.match(/\{([a-zA-Z0-9_]+)\}/g) || []).map((m) => m.slice(1, -1));
  if (params && params.length > 0) {
    for (const p of params) {
      if (!extractedParams.includes(p)) {
        errors.push(`Missing required parameter: {${p}}`);
      }
    }
  }

  // Check 5: Max length validation
  const effectiveMax = maxLength || UI_MAX_LENGTHS[kind] || 2000;
  if (value.length > effectiveMax) {
    errors.push(`Value length (${value.length}) exceeds maximum limit (${effectiveMax}) for ${kind}`);
  }

  // Check 6: Glossary terms
  try {
    const terms = await prisma.glossaryTerm.findMany({
      where: { locale },
    });

    for (const term of terms) {
      for (const forbidden of term.forbidden) {
        if (value.toLowerCase().includes(forbidden.toLowerCase())) {
          const msg = `Contains forbidden term "${forbidden}". Preferred term: "${term.preferred}"`;
          if (strict) {
            errors.push(msg);
          } else {
            warnings.push(msg);
          }
        }
      }
    }
  } catch {}

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

