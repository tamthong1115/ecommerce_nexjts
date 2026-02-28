import {
  createReviewRoute,
  getReviewsRoute,
} from '@/features/review/server/controller/review.route';

export const GET = getReviewsRoute;

export const POST = createReviewRoute;
