import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ActionType } from '@prisma/client';
import { getActionLogsService } from '@/features/manager/logs/services/action-log.service';
import { HttpStatus } from '@/types/api';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== 'admin') {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthorized',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || undefined;
    const targetTable = searchParams.get('targetTable') || undefined;
    const rawActionType = searchParams.get('actionType');
    const actionType = rawActionType && Object.values(ActionType).includes(rawActionType as ActionType)
      ? (rawActionType as ActionType)
      : undefined;

    const { items, pagination } = await getActionLogsService({
      page,
      limit,
      search,
      actionType,
      targetTable,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: items,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        message: 'Success',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
}
