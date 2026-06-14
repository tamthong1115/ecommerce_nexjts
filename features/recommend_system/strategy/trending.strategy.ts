import { RecommendStrategy } from './base.strategy';
import { RECOMMEND_URLS } from '@/features/recommend_system/recommend.enpoint';

export class TrendingStrategy implements RecommendStrategy {
  getEndpoint() {
    return `${RECOMMEND_URLS.BASE}${RECOMMEND_URLS.RECOMMEND}${RECOMMEND_URLS.TRENDING}`;
  }
  getCacheKey() {
    return `recs:trending`;
  }
  cacheType = 'FULL' as const;
}
