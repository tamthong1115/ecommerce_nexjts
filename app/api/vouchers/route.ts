import { ResponseFactory } from '@/lib/api-response';
import { NextRequest } from 'next/server';
import { HttpStatus } from '@/types/api';
import {
  createVoucherService,
  getAvailableVouchersService,
} from '@/features/voucher/services/voucher.service';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { $Enums } from '@/lib/generated/prisma';
import Role = $Enums.Role;
import { createVoucherSchema } from '@/features/voucher/types/validation';

export async function GET(req: NextRequest) {
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

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({ data: vouchers })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

export async function POST(req: NextRequest) {
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
      if (data.categoryIds && data.categoryIds.length > 0) {
        data.categoryIds = undefined;
      }
    } else if (currentUser?.role === Role.admin) {
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
}
