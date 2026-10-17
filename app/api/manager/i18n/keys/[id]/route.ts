import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ResponseFactory } from '@/lib/api-response';
import { withPermission } from '@/lib/authz/with-permission';
import { HttpStatus } from '@/types/api';

export const DELETE = withPermission('platform:i18n:delete')(async (req: NextRequest, { params, subject }) => {
  try {
    const resolvedParams = await Promise.resolve(params);
    const keyId = resolvedParams.id as string;

    const existingKey = await prisma.translationKey.findUnique({
      where: { id: keyId },
      include: { values: true },
    });

    if (!existingKey) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Translation key not found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    if (existingKey.source === 'CODE') {
      // CODE keys cannot be deleted; reset overrides back to baseValue
      await prisma.$transaction(async (tx) => {
        for (const val of existingKey.values) {
          if (val.baseValue) {
            await tx.translationRevision.create({
              data: {
                valueId: val.id,
                oldValue: val.value,
                newValue: val.baseValue,
                action: 'RESET',
                actorId: subject.userId,
              },
            });

            await tx.translationValue.update({
              where: { id: val.id },
              data: {
                value: val.baseValue,
                status: 'PUBLISHED',
                publishedValue: val.baseValue,
                updatedById: subject.userId,
              },
            });
          }
        }
      });

      return ResponseFactory.toNextResponse(
        ResponseFactory.success({
          data: { reset: true },
          message: 'Code key overrides reset to default base values',
          code: HttpStatus.OK,
        })
      );
    }

    // For DB created keys, soft delete (DEPRECATED)
    const deprecatedKey = await prisma.translationKey.update({
      where: { id: keyId },
      data: {
        status: 'DEPRECATED',
      },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: deprecatedKey,
        message: 'Database key marked as DEPRECATED',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

