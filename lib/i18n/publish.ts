import { prisma } from '@/lib/db';
import { redisClient } from '@/lib/redis';
import { locales } from '@/i18n/config';
import { buildMessages } from './build';
import { revalidatePath } from 'next/cache';

export async function publishI18n(actorId: string, valueIds?: string[]): Promise<number> {
  const whereClause: any = {
    status: 'DRAFT',
  };
  if (valueIds && valueIds.length > 0) {
    whereClause.id = { in: valueIds };
  }

  const drafts = await prisma.translationValue.findMany({
    where: whereClause,
  });

  if (drafts.length === 0 && (!valueIds || valueIds.length === 0)) {
    // If publish all requested, rebuild Redis blobs directly
    for (const locale of locales) {
      const messages = await buildMessages(locale);
      if (redisClient) {
        await redisClient.set(`i18n:messages:${locale}`, JSON.stringify(messages));
      }
    }
    if (redisClient) {
      await redisClient.incr('i18n:version');
    }
    try {
      revalidatePath('/', 'layout');
    } catch {}
    return 0;
  }

  await prisma.$transaction(async (tx) => {
    for (const draft of drafts) {
      await tx.translationRevision.create({
        data: {
          valueId: draft.id,
          oldValue: draft.publishedValue || draft.baseValue,
          newValue: draft.value,
          action: 'PUBLISH',
          actorId,
        },
      });

      await tx.translationValue.update({
        where: { id: draft.id },
        data: {
          status: 'PUBLISHED',
          publishedValue: draft.value,
          updatedById: actorId,
        },
      });
    }
  });

  for (const locale of locales) {
    const messages = await buildMessages(locale);
    if (redisClient) {
      await redisClient.set(`i18n:messages:${locale}`, JSON.stringify(messages));
    }
  }

  if (redisClient) {
    await redisClient.incr('i18n:version');
  }

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return drafts.length;
}

