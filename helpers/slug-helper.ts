import { isSlugTaken } from './slug-server';

/**
 * Converts a string to a URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normalize Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd') // Vietnamese đ
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
}

/**
 * Generates a unique slug by appending a random suffix if needed
 */
export function makeUniqueSlug(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Generates a guaranteed unique slug for a product
 */
export async function generateUniqueProductSlug(
  title: string,
  productId?: string
): Promise<string> {
  const baseSlug = generateSlug(title);

  // Check if base slug is available
  const taken = await isSlugTaken(baseSlug, productId);

  if (!taken) {
    return baseSlug;
  }

  // If taken, append random suffix
  let uniqueSlug = makeUniqueSlug(baseSlug);
  let attempts = 0;
  const maxAttempts = 10;

  while ((await isSlugTaken(uniqueSlug, productId)) && attempts < maxAttempts) {
    uniqueSlug = makeUniqueSlug(baseSlug);
    attempts++;
  }

  return uniqueSlug;
}

/**
 * Client-side slug generator (without database check)
 */
export function generateClientSlug(title: string): string {
  if (!title || title.trim().length === 0) {
    return '';
  }
  return generateSlug(title);
}
