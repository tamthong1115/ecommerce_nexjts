import { RecommendStrategy } from '@/features/recommend_system/strategy/base.strategy';
import redis from '@/lib/redis';
import {
  productRecommendDto,
  RecommendResponseDTO,
} from '@/features/recommend_system/recommend.dto';
import { serverFetch } from '@/lib/server-fetch';
import consola from 'consola';
import { prisma } from '@/lib/db';

const CACHE_TTL = 3600;

export class RecommendationService {
  async getProducts(
    strategy: RecommendStrategy,
    productId?: string
  ): Promise<productRecommendDto[]> {
    // get cache key based on strategy and productId
    const cacheKey = strategy.getCacheKey(productId);
    const endpoint = strategy.getEndpoint(productId);

    // Query from redis
    const cachedData = await redis.get(cacheKey);
    let productIds: string[] = [];

    //! Situation 1: Cache hit - Return data based on cacheType
    if (cachedData) {
      // If cacheType is FULL, return full product data from cache
      const parseData = JSON.parse(cachedData);
      if (strategy.cacheType === 'FULL') {
        return parseData as productRecommendDto[];
      }

      // If cacheType is IDS_ONLY, fetch full product data from DB using cached IDs
      if (strategy.cacheType === 'IDS_ONLY') {
        return this.fetchFullProductsFromDB(parseData);
      }
    }

    //! Situation 2 - Cache miss - Fetch recommendation IDs from recommendation service
    try {
      const data = await serverFetch.get<RecommendResponseDTO>(endpoint);
      productIds = data.recommendations.map((r) => r.product_id);
    } catch (error) {
      consola.error('Lỗi lấy recommendation:', error);
      return [];
    }

    if (productIds.length === 0) return [];

    // Query DB to take full data
    const fullProducts = await this.fetchFullProductsFromDB(productIds);

    //! Situation 3: Cache miss - Store results in Redis based on strategy
    if (strategy.cacheType === 'FULL') {
      // Trending: Lưu full cục data to bự vào Redis
      await redis.set(cacheKey, JSON.stringify(fullProducts), 'EX', CACHE_TTL);
    } else {
      // CF/FP: Chỉ lưu mảng ID bé xíu vào Redis
      await redis.set(cacheKey, JSON.stringify(productIds), 'EX', CACHE_TTL);
    }

    return fullProducts;
  }

  private async fetchFullProductsFromDB(
    productIds: string[]
  ): Promise<productRecommendDto[]> {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        minPrice: true,
        ratingAvg: true,
        ratingCount: true,
        soldCount: true,
        description: true,
        origin: true,
        images: {
          take: 1,
          select: { url: true },
        },
        VoucherProduct: {
          where: {
            voucher: {
              isActive: true,
              endAt: { gte: new Date() },
            },
          },
          select: {
            voucher: {
              select: {
                maxDiscount: true,
                type: true,
                value: true,
              },
            },
          },
        },
      },
    });

    const result = productIds
      .map((id) => {
        const p = products.find((prod) => prod.id === id);
        if (!p) return null;
        const activeVoucher = p.VoucherProduct?.[0]?.voucher;
        return {
          id: p.id,
          title: p.title,
          minPrice: Number(p.minPrice),
          ratingAvg: String(p.ratingAvg),
          ratingCount: Number(p.ratingCount),
          soldCount: p.soldCount ?? 0,
          description: p.description,
          origin: p.origin,
          imageUrl: p.images?.[0]?.url || '',
          voucher: activeVoucher
            ? {
                type: activeVoucher.type,
                value: Number(activeVoucher.value),
                maxDiscount: activeVoucher.maxDiscount
                  ? Number(activeVoucher.maxDiscount)
                  : 0,
              }
            : null,
        };
      })
      .filter((item): item is productRecommendDto => item !== null);
    consola.info(result);
    return result;
  }
}
