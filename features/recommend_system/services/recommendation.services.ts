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
    const cacheKey = strategy.getCacheKey(productId);
    const endpoint = strategy.getEndpoint(productId);

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const parseData = JSON.parse(cachedData);
        if (strategy.cacheType === 'FULL') {
          return parseData as productRecommendDto[];
        }
        if (strategy.cacheType === 'IDS_ONLY') {
          return this.fetchFullProductsFromDB(parseData);
        }
      }
    } catch (cacheError) {
      consola.warn('[Recommendation] Redis cache read failed, continuing without cache');
    }

    let productIds: string[] = [];

    try {
      const data = await serverFetch.get<RecommendResponseDTO>(endpoint);
      productIds = data?.recommendations?.map((r) => r.product_id) || [];
    } catch (error) {
      consola.warn(
        `[Recommendation] Service không khả dụng (${endpoint}). Sử dụng fallback từ database.`
      );
      return this.fetchFallbackProducts(productId);
    }

    if (productIds.length === 0) {
      return this.fetchFallbackProducts(productId);
    }

    const fullProducts = await this.fetchFullProductsFromDB(productIds);

    try {
      if (strategy.cacheType === 'FULL') {
        await redis.set(cacheKey, JSON.stringify(fullProducts), 'EX', CACHE_TTL);
      } else {
        await redis.set(cacheKey, JSON.stringify(productIds), 'EX', CACHE_TTL);
      }
    } catch (cacheSetError) {
      consola.warn('[Recommendation] Redis cache set failed');
    }

    return fullProducts;
  }

  private async fetchFallbackProducts(
    excludeProductId?: string
  ): Promise<productRecommendDto[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
        },
        take: 8,
        orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }],
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

      return products.map((p) => {
        const activeVoucher = p.VoucherProduct?.[0]?.voucher;
        return {
          id: p.id,
          title: p.title,
          minPrice: Number(p.minPrice),
          ratingAvg: String(p.ratingAvg),
          ratingCount: Number(p.ratingCount),
          soldCount: p.soldCount ?? 0,
          description: p.description ?? '',
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
      });
    } catch (error) {
      consola.error('[Recommendation] Lỗi khi lấy fallback sản phẩm:', error);
      return [];
    }
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

    return productIds
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
          description: p.description ?? '',
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
  }
}
