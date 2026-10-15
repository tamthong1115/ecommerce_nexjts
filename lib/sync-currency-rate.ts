import { redisClient } from '@/lib/redis';

const RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const RATE_KEY = 'currency-rate';
const RATE_TTL_SECONDS = 7 * 24 * 3600;

/** Fetch USD->VND and cache it in Redis. Throws on any failure so callers can retry. */
export async function syncCurrencyRate(): Promise<number> {
  const res = await fetch(RATE_API);
  if (!res.ok) throw new Error(`Fetch rate failed: ${res.statusText}`);

  const rate = (await res.json()).rates?.VND;
  if (!rate) throw new Error('VND rate not found in API response');

  await redisClient.setex(RATE_KEY, RATE_TTL_SECONDS, rate.toString());
  return rate;
}
