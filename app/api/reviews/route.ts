import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import {
  createProductReviewService,
  getProductReviewsService,
} from '@/features/review/services/review.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id') || '';
    const filterBy = searchParams.get('filterBy');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 10);

    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Missing id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const result = await getProductReviewsService({
      id,
      filterBy,
      page,
      limit,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: {
          reviews: result.reviews,
          summary: result.summary,
        },
        total: result.total,
        page: result.page,
        limit: result.limit,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function POST(req: NextRequest) {
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

    const review = await createProductReviewService(userId, data);

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
