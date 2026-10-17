import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ResponseFactory } from '@/lib/api-response';
import { withPermission } from '@/lib/authz/with-permission';
import { HttpStatus } from '@/types/api';
import { z } from 'zod';
import { validateTranslationValue } from '@/lib/i18n/validate';
import { locales } from '@/i18n/config';

const createKeySchema = z.object({
  namespace: z.string().min(2),
  key: z.string().min(1),
  description: z.string().optional(),
  tier: z.enum(['SHARED', 'FEATURE']).default('FEATURE'),
  kind: z.enum(['BUTTON', 'LABEL', 'TITLE', 'MESSAGE', 'ERROR', 'HELP']).default('MESSAGE'),
  maxLength: z.number().int().positive().optional().nullable(),
  values: z.record(z.string(), z.string()),
});

export const GET = withPermission('platform:i18n:read')(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const namespace = searchParams.get('ns') || undefined;
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (namespace) where.namespace = namespace;
    if (status) where.status = status;
    if (tier) where.tier = tier;

    if (q) {
      where.OR = [
        { key: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          values: {
            some: {
              value: { contains: q, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.translationKey.count({ where }),
      prisma.translationKey.findMany({
        where,
        include: {
          values: {
            orderBy: { locale: 'asc' },
          },
        },
        skip,
        take: limit,
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
      }),
    ]);

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: items,
        page,
        limit,
        total,
        message: 'Translations retrieved successfully',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const POST = withPermission('platform:i18n:create')(async (req: NextRequest, { subject }) => {
  try {
    const body = await req.json();
    const validated = createKeySchema.parse(body);

    const existing = await prisma.translationKey.findUnique({
      where: {
        namespace_key: {
          namespace: validated.namespace,
          key: validated.key,
        },
      },
    });

    if (existing) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: `Key "${validated.key}" already exists in namespace "${validated.namespace}"`,
          code: HttpStatus.CONFLICT,
        })
      );
    }

    // Validate all provided values
    for (const loc of locales) {
      const val: string = String(validated.values[loc] || '');
      const valCheck = await validateTranslationValue({
        locale: loc,
        value: val,
        kind: validated.kind,
        maxLength: validated.maxLength,
      });
      if (!valCheck.valid) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: `Validation failed for locale [${loc}]: ${valCheck.errors.join(', ')}`,
            code: HttpStatus.UNPROCESSABLE_ENTITY,
          })
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const tKey = await tx.translationKey.create({
        data: {
          namespace: validated.namespace,
          key: validated.key,
          description: validated.description,
          source: 'DB',
          status: 'ACTIVE',
          tier: validated.tier,
          kind: validated.kind,
          maxLength: validated.maxLength,
        },
      });

      for (const loc of locales) {
        const val: string = String(validated.values[loc] || '');
        const createdVal = await tx.translationValue.create({
          data: {
            keyId: tKey.id,
            locale: loc,
            value: val,
            baseValue: null,
            publishedValue: null,
            status: 'DRAFT',
            updatedById: subject.userId,
          },
        });

        await tx.translationRevision.create({
          data: {
            valueId: createdVal.id,
            oldValue: null,
            newValue: val,
            action: 'UPDATE',
            actorId: subject.userId,
          },
        });
      }

      return tKey;
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: created,
        message: 'Translation key created successfully as draft',
        code: HttpStatus.CREATED,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

