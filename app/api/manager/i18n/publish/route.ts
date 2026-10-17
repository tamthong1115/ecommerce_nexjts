import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api-response';
import { withPermission } from '@/lib/authz/with-permission';
import { HttpStatus } from '@/types/api';
import { publishI18n } from '@/lib/i18n/publish';
import { z } from 'zod';

const publishSchema = z.object({
  valueIds: z.array(z.string().uuid()).optional(),
});

export const POST = withPermission('platform:i18n:publish')(async (req: NextRequest, { subject }) => {
  try {
    let valueIds: string[] | undefined;
    try {
      const body = await req.json();
      const validated = publishSchema.parse(body);
      valueIds = validated.valueIds;
    } catch {}

    const publishedCount = await publishI18n(subject.userId, valueIds);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: { publishedCount },
        message: `Successfully published ${publishedCount} translation(s) to live runtime`,
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

