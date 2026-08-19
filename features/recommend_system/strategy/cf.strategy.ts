import { RecommendStrategy } from '@/features/recommend_system/strategy/base.strategy';
import { RECOMMEND_URLS } from '@/features/recommend_system/recommend.enpoint';

export class CFStrategy implements RecommendStrategy {
  getEndpoint(productId: string) {
    return `${RECOMMEND_URLS.BASE}${RECOMMEND_URLS.RECOMMEND}/${productId}${RECOMMEND_URLS.ALSO_LIKED}`;
  }
  getCacheKey(productId: string) {
    return `recs:cf:${productId}`;
  }
  cacheType = 'IDS_ONLY' as const;
}
