import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';

export interface GetProductReviewsParams {
  id: string;
  filterBy?: string | null;
  page?: number;
  limit?: number;
}

export const getProductReviewsService = async (params: GetProductReviewsParams) => {
  const { id, filterBy } = params;
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 10);
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ReviewWhereInput = {
    productId: id,
  };

  const orderClause: Prisma.ReviewOrderByWithAggregationInput = {
    createdAt: 'asc',
  };

  if (filterBy && !isNaN(Number(filterBy))) {
    whereClause.rating = Number(filterBy);
  }

  if (filterBy === 'newest') orderClause.createdAt = 'desc';

  const [total, reviews, ratingGroups, imagesResult] = await Promise.all([
    prisma.review.count({ where: { productId: id } }),
    prisma.review.findMany({
      where: whereClause,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        likes: true,
        images: true,
        user: { select: { id: true, name: true, image: true } },
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: orderClause,
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId: id },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: {
        productId: id,
        images: { not: Prisma.JsonNull },
      },
      select: { images: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingGroups.forEach((group) => {
    if (group.rating >= 1 && group.rating <= 5) {
      ratingBreakdown[group.rating as keyof typeof ratingBreakdown] =
        group._count._all;
    }
  });

  const allImages = imagesResult
    .map((item) => item.images)
    .flat()
    .filter((img: any) => img && typeof img === 'object' && 'url' in img)
    .map((img: any) => ({ url: img.url }));

  return {
    reviews,
    summary: {
      ratingBreakdown,
      totalImages: allImages.length,
      allImages,
    },
    total,
    page,
    limit,
  };
};

export const createProductReviewService = async (userId: string, data: any) => {
  return prisma.review.create({
    data: {
      productId: data.productId,
      userId: userId,
      rating: data.rating,
      orderItemId: data.orderItemId || null,
      title: data.title || null,
      body: data.body || null,
      images:
        data.images && data.images.length > 0
          ? data.images?.map((i: any) => ({
              url: i.url,
              publicId: i.publicId,
              alt: i.alt,
              position: i.position,
            }))
          : Prisma.JsonNull,
    },
  });
};
