import { RecommendStrategy } from '@/features/recommend_system/strategy/base.strategy';
import { RECOMMEND_URLS } from '@/features/recommend_system/recommend.enpoint';

export class FpGrowthStrategy implements RecommendStrategy {
  getEndpoint(productId?: string): string {
    return `${RECOMMEND_URLS.BASE}${RECOMMEND_URLS.RECOMMEND}/${productId}${RECOMMEND_URLS.BOUGHT_TOGETHER}`;
  }

  getCacheKey(productId?: string): string {
    return `recs:fp-growth:${productId}`;
  }
  cacheType = 'IDS_ONLY' as const;
}
