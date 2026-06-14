import Redis, { RedisOptions } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:4000';

const connectionOptions: RedisOptions = {
  maxRetriesPerRequest: null,

  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
};

const globalForRedis = global as unknown as { redis: Redis };

export const redisClient =
  globalForRedis.redis || new Redis(REDIS_URL, connectionOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redisClient;
}

redisClient.on('connect', () => console.log('✅ Redis Connected via ioredis'));
redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

export default redisClient;
