import 'dotenv/config';
import { redisClient } from '@/lib/redis';
import { locales } from '@/i18n/config';
import { buildMessages } from '@/lib/i18n/build';

export async function publishAllToRedis(): Promise<void> {
  console.log('Rebuilding live i18n messages blobs for locales:', locales);

  for (const locale of locales) {
    const messages = await buildMessages(locale);
    if (redisClient) {
      await redisClient.set(`i18n:messages:${locale}`, JSON.stringify(messages));
      console.log(`- Cached blob for locale [${locale}]`);
    }
  }

  if (redisClient) {
    const newVer = await redisClient.incr('i18n:version');
    console.log(`- Updated i18n:version to ${newVer}`);
  }

  console.log('✅ Rebuilt and published all messages blobs to Redis.');
}

if (process.argv[1]?.includes('i18n-publish-all')) {
  publishAllToRedis()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to publish all:', err);
      process.exit(1);
    });
}

