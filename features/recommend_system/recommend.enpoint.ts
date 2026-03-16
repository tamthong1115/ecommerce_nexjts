export const RECOMMEND_URLS = {
  BASE: process.env.RECOMMEND_BASE_URL || 'http://localhost:8000/v1',
  RECOMMEND: '/recommend',

  // Another endpoints for model management, health checks, etc.
  TRAIN: '/train',
  HEALTH: '/health',

  // Algorithm-specific endpoints
  TRENDING: '/trending',
  SIMILAR: '/similar',
  ALSO_LIKED: '/also-liked',
  BOUGHT_TOGETHER: '/bought-together',
};
