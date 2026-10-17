import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ResponseFactory } from '@/lib/api-response';
import { withPermission } from '@/lib/authz/with-permission';
import { HttpStatus } from '@/types/api';

export const GET = withPermission('platform:i18n:read')(async (req: NextRequest, { params }) => {
  try {
    const resolvedParams = await Promise.resolve(params);
    const keyId = resolvedParams.id as string;

    const key = await prisma.translationKey.findUnique({
      where: { id: keyId },
      include: {
        values: {
          include: {
            revisions: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
      },
    });

    if (!key) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Translation key not found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: key,
        message: 'History retrieved successfully',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

