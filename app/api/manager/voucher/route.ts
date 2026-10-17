import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { withAdmin } from '@/lib/with-auth';
import { getAdminVouchersService } from '@/features/voucher/services/voucher.service';

export const GET = withAdmin(async (_userId: string, req: NextRequest) => {
  try {

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 12;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.has('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined;
    const type = searchParams.get('type') || undefined;

    const result = await getAdminVouchersService({
      page,
      limit,
      search,
      isActive,
      type,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: result })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});
