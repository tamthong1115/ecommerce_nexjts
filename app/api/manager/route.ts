import { ResponseFactory } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api';

export const GET = withAdmin(async (userId: string) => {
  try {
    const data = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
      },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (err) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(err));
  }
});
