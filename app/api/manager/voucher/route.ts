import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAdminVouchersService } from '@/features/voucher/server/voucher.service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || session.user.role !== 'admin') {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Unathorized', code: 401 })
      );
    }

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
}
