export interface RecommendStrategy {
  getEndpoint(productId?: string): string;
  getCacheKey(productId?: string): string;
  cacheType: 'FULL' | 'IDS_ONLY';
}
