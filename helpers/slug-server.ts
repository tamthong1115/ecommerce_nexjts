'use server';

import { prisma } from '@/lib/db';

/**
 * server-side: Checks if a slug already exists in the database
 */
export async function isSlugTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.product.findFirst({
    where: {
      slug,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!existing;
}
