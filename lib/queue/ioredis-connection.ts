import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in .env');
}

// maxRetriesPerRequest: null is mandatory for BullMQ workers
export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});
