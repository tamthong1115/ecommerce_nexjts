import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { withAdmin } from '@/lib/with-auth';
import { ActionType } from '@prisma/client';
import { getActionLogsService } from '@/features/manager/logs/services/action-log.service';
import { HttpStatus } from '@/types/api';

export const GET = withAdmin(async (_userId: string, req: NextRequest) => {
  try {

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
});
