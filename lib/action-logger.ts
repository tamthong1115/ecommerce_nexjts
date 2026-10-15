import { prisma } from '@/lib/db';
import { ActionSource, ActionType } from '@prisma/client';
import { getTraceContext } from '@/lib/request-context';

export interface LogActionOptions {
  actionType: ActionType;
  actionCode: string;
  actionSource?: ActionSource;
  actorId?: string | null;
  targetTable?: string;
  targetId?: string;
  requestId?: string;
  actorIp?: string;
  userAgent?: string;
  oldData?: unknown;
  newData?: unknown;
  metadata?: Record<string, unknown>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function logAction(options: LogActionOptions) {
  try {
    const trace = getTraceContext();

    const candidateActorId = options.actorId || trace?.userId;
    const actorId = candidateActorId && UUID_REGEX.test(candidateActorId) ? candidateActorId : null;

    const actionSource = options.actionSource || trace?.actionSource || ActionSource.SYSTEM;
    const actorIp = options.actorIp || trace?.ip || null;
    const userAgent = options.userAgent || trace?.userAgent || null;

    return await prisma.actionLog.create({
      data: {
        actionType: options.actionType,
        actionCode: options.actionCode,
        actionSource,
        actorId,
        targetTable: options.targetTable || null,
        targetId: options.targetId ? String(options.targetId) : null,
        requestId: options.requestId || null,
        actorIp,
        userAgent,
        oldData: options.oldData ? JSON.parse(JSON.stringify(options.oldData)) : undefined,
        newData: options.newData ? JSON.parse(JSON.stringify(options.newData)) : undefined,
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error('[ActionLogger] Failed to write action log:', error);
    return null;
  }
}
