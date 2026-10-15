import { ResponseFactory } from '@/lib/api-response';
import { NextRequest } from 'next/server';
import { getShopVouchersService } from '@/features/voucher/services/voucher.service';
import { requireSeller } from '@/lib/require-admin';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sellerSession = await requireSeller();

    if (!sellerSession) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({ message: 'Unauthorized', code: 401 })
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.has('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined;
    const type = searchParams.get('type') || undefined;
    const shopId = searchParams.get('shopId') || undefined;

    const shopIds: string[] = [];

    if (!shopId) {
      const shopOwner = await prisma.shop.findMany({
        where: { ownerId: sellerSession.user.id },
        select: { id: true },
      });
      shopOwner.forEach((owner) => shopIds.push(owner.id));
    } else {
      shopIds.push(shopId);
    }

    const result = await getShopVouchersService({
      page,
      limit,
      search,
      isActive,
      type,
      shop: shopIds,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: result.vouchers,
        page,
        limit,
        total: result.pagination.total,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}
