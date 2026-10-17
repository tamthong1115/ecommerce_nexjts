import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ResponseFactory } from '@/lib/api-response';
import { withPermission } from '@/lib/authz/with-permission';
import { HttpStatus } from '@/types/api';
import { z } from 'zod';
import { validateTranslationValue } from '@/lib/i18n/validate';

const updateValueSchema = z.object({
  value: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'NEEDS_REVIEW']).default('DRAFT'),
});

export const PATCH = withPermission('platform:i18n:update')(async (req: NextRequest, { params, subject }) => {
  try {
    const resolvedParams = await Promise.resolve(params);
    const valueId = resolvedParams.id as string;
    const body = await req.json();
    const validated = updateValueSchema.parse(body);

    const existing = await prisma.translationValue.findUnique({
      where: { id: valueId },
      include: { key: true },
    });

    if (!existing) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Translation value not found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    const valCheck = await validateTranslationValue({
      locale: existing.locale,
      value: validated.value,
      kind: existing.key.kind,
      maxLength: existing.key.maxLength,
      params: existing.key.params,
    });

    if (!valCheck.valid) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: valCheck.errors.join(', '),
          code: HttpStatus.UNPROCESSABLE_ENTITY,
        })
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.translationRevision.create({
        data: {
          valueId: existing.id,
          oldValue: existing.value,
          newValue: validated.value,
          action: 'UPDATE',
          actorId: subject.userId,
        },
      });

      return await tx.translationValue.update({
        where: { id: existing.id },
        data: {
          value: validated.value,
          status: validated.status,
          updatedById: subject.userId,
        },
      });
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: updated,
        message: 'Draft saved successfully',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

