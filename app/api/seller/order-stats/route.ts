import { ResponseFactory } from '@/lib/api-response';
import { requireSeller } from '@/lib/require-admin';
import { GetOrderStatsSchema } from '@/features/order/types/order.dto';
import { getOrderStats } from '@/features/order/services/order.service';

export async function GET(req: Request) {
  try {
    const session = await requireSeller();
    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Unauthorized', code: 401 })
      );
    }

    const { searchParams } = new URL(req.url);

    const rawInput = {
      shopId: searchParams.get('shopId') || 'all',
      days: searchParams.get('days'),
    };

    const validation = GetOrderStatsSchema.safeParse(rawInput);

    if (!validation.success) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Invalid parameters',
          code: 400,
          errors: validation.error.flatten().fieldErrors,
        })
      );
    }

    const stats = await getOrderStats(session.user.id, validation.data);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: stats })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
}
