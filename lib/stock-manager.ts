import redisClient from '@/lib/redis';
import { prisma } from '@/lib/db';

export class StockManager {
  static async getStock(variantId: string): Promise<number> {
    const key = `stock:${variantId}`;
    const stock = await redisClient.get(key);

    if (stock !== null) {
      return parseInt(stock, 10);
    }

    const variantStock = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    const stockDb = variantStock?.stock ?? 0;

    await redisClient.setex(key, 86400, stockDb.toString());

    return stockDb;
  }

  static async reserveStock(variantId: string, quantity: number) {
    const key = `stock:${variantId}`;
    const script = `
      if redis.call('exists', KEYS[1]) == 1 then
        local current = tonumber(redis.call('get', KEYS[1]))
        if current >= tonumber(ARGV[1]) then
          redis.call('decrby', KEYS[1], ARGV[1])
          return 1
        else
          return 0
        end
      else
        return -2 
      end
    `;

    const result = await redisClient.eval(script, 1, key, quantity);
    if (result === -2) {
      console.log(`Redis miss stock for ${variantId}. Fetching from DB...`);

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      });

      if (!variant) return false;

      if (variant.stock >= quantity) {
        const remaining = variant.stock - quantity;

        const pipeline = redisClient.pipeline();
        pipeline.set(key, remaining);
        pipeline.expire(key, 86400);
        await pipeline.exec();

        return true;
      } else {
        await redisClient.setex(key, 3600, variant.stock);
        return false;
      }
    }

    return result === 1;
  }

  static async releaseStock(variantId: string, quantity: number) {
    const key = `stock:${variantId}`;
    const script = `
      if redis.call('exists', KEYS[1]) == 1 then
        return redis.call('incrby', KEYS[1], ARGV[1])
      else
        return 0
      end
    `;
    await redisClient.eval(script, 1, key, quantity);
    console.log(`Đã hoàn ${quantity} sản phẩm ${variantId} về kho Redis.`);
  }
}
