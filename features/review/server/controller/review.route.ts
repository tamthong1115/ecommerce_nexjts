import { ResponseFactory } from '@/lib/api-response';
import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function getReviewsRoute(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id') || '';
    const filterBy = searchParams.get('filterBy');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
    const skip = (page - 1) * limit;

    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Missing id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

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

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: {
          reviews,
          summary: {
            ratingBreakdown,
            totalImages: allImages.length,
            allImages,
          },
        },
        total,
        page,
        limit,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function createReviewRoute(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }
    const data = await req.json();

    const review = await prisma.review.create({
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

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: review,
        message: 'Review successful',
        code: HttpStatus.CREATED,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
