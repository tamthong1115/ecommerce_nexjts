import { RecommendStrategy } from '@/features/recommend_system/strategy/base.strategy';
import { RECOMMEND_URLS } from '@/features/recommend_system/recommend.enpoint';

export class TfidfStrategy implements RecommendStrategy {
  getEndpoint(productId: string) {
    return `${RECOMMEND_URLS.BASE}${RECOMMEND_URLS.RECOMMEND}/${productId}${RECOMMEND_URLS.SIMILAR}`;
  }
  getCacheKey(productId: string) {
    return `recs:tfidf:${productId}`;
  }
  cacheType = 'IDS_ONLY' as const;
}
