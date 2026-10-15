import { prisma } from '@/lib/db';
import { ActionType, Prisma } from '@prisma/client';

export interface GetActionLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  actionType?: ActionType;
  targetTable?: string;
}

export async function getActionLogsService(params: GetActionLogsParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.ActionLogWhereInput = {};

  if (params.actionType && Object.values(ActionType).includes(params.actionType)) {
    where.actionType = params.actionType;
  }

  if (params.targetTable) {
    where.targetTable = {
      equals: params.targetTable,
      mode: 'insensitive',
    };
  }

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { actionCode: { contains: term, mode: 'insensitive' } },
      { targetTable: { contains: term, mode: 'insensitive' } },
      { targetId: { contains: term, mode: 'insensitive' } },
      { actorIp: { contains: term, mode: 'insensitive' } },
      {
        actor: {
          is: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.actionLog.count({ where }),
    prisma.actionLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export type ActionLogItem = Awaited<ReturnType<typeof getActionLogsService>>['items'][number];
