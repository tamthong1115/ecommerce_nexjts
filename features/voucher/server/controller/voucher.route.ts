import { ResponseFactory } from '@/lib/api-response';
import { NextRequest } from 'next/server';
import { HttpStatus } from '@/types/api';
import {
  createVoucherService,
  getAvailableVouchersService,
  getShopVouchersService,
} from '@/features/voucher/server/voucher.service';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import Role = $Enums.Role;
import { createVoucherSchema } from '@/features/voucher/validation';
import { requireSeller } from '@/lib/require-admin';

class VoucherController {
  public getVouchers = async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const shopId = searchParams.get('shopId');
      const productId = searchParams.get('productId');

      if (!shopId) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Missing shopId parameter',
            code: HttpStatus.BAD_REQUEST,
          })
        );
      }

      const vouchers = await getAvailableVouchersService(
        shopId,
        productId || undefined
      );

      // return ResponseFactory.toNextResponse(ResponseFactory.paginated());
      return ResponseFactory.toNextResponse(
        ResponseFactory.success({ data: vouchers })
      );
    } catch (error) {
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
    }
  };

  public createVoucher = async (req: NextRequest) => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Unauthorized',
            code: HttpStatus.UNAUTHORIZED,
          })
        );
      }

      const rawData = await req.json().catch(() => ({}));

      const validation = createVoucherSchema.safeParse(rawData);
      if (!validation.success) {
        return ResponseFactory.toNextResponse(
          ResponseFactory.error({
            message: 'Validation failed',
            code: HttpStatus.BAD_REQUEST,
            errors: validation.error.flatten().fieldErrors,
          })
        );
      }

      const data = validation.data;

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (currentUser?.role === Role.seller) {
        if (!data.productIds || data.productIds.length === 0) {
          return ResponseFactory.toNextResponse(
            ResponseFactory.error({
              message: 'Shop vouchers must apply to at least one product.',
              code: HttpStatus.BAD_REQUEST,
              errors: { productIds: ['Required for seller vouchers'] },
            })
          );
        }
        // Sellers cannot set categories globally
        if (data.categoryIds && data.categoryIds.length > 0) {
          data.categoryIds = undefined;
        }
      } else if (currentUser?.role === Role.admin) {
        // Admins creating platform vouchers (shopId null)
        if (!data.shopId) {
          data.shopId = null;
        }
      }

      const result = await createVoucherService(data);

      return ResponseFactory.toNextResponse(
        ResponseFactory.success({
          data: result,
          message: 'Voucher created successfully',
          code: HttpStatus.CREATED,
        })
      );
    } catch (error: any) {
      return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
    }
  };

  public getVouchersByShop = async (req: NextRequest) => {
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

      const shopIds = [];

      if (!shopId) {
        const shopOwner = await prisma.shop.findMany({
          where: { ownerId: sellerSession.user.id },
          select: { id: true },
        });
        shopOwner.map((owner) => shopIds.push(owner.id));
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
      const errorResponse = ResponseFactory.handleError(error);
      return ResponseFactory.toNextResponse(errorResponse);
    }
  };
}

export const voucherController = new VoucherController();
