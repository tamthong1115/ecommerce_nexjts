'use server';
import { prisma } from '@/lib/db';
import { generateClientSku, randomSuffix } from './sku-helper';

/**
 * Server-side check: is SKU taken globally (uses prisma)
 */
export async function isSkuTaken(
  sku: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.productVariant.findFirst({
    where: {
      sku,
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true },
  });
  return !!existing;
}

/**
 * Server-side: generate a guaranteed unique SKU (checks DB). Use from server APIs if needed.
 */
export async function generateUniqueSkuServer(name?: string): Promise<string> {
  const base = generateClientSku(name).replace(/-[A-Z0-9]{4}$/, ''); // keep base portion
  let candidate = `${base}-${randomSuffix(4)}`;
  let attempts = 0;
  const maxAttempts = 10;
  while ((await isSkuTaken(candidate)) && attempts < maxAttempts) {
    candidate = `${base}-${randomSuffix(4)}`;
    attempts++;
  }
  return candidate;
}
