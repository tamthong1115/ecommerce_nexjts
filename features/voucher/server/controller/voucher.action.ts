'use server';

import { requireAdmin, requireSeller } from '@/lib/require-admin';
import { ResponseFactory } from '@/lib/api-response';
import { ApiResponse } from '@/types/api';
import { disableVoucherService } from '@/features/voucher/server/voucher.service';

export const disableVoucherAction = async (
  voucherId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    // Get the usr session
    const session = await requireSeller();

    if (!session?.user?.id) {
      return ResponseFactory.error({ message: 'Unauthorized', code: 401 });
    }

    const result = await disableVoucherService(
      voucherId,
      session.user.id,
      false
    );

    return ResponseFactory.success({
      data: result,
      message: 'Voucher disabled successfully',
    });
  } catch (error) {
    return ResponseFactory.handleError(error);
  }
};

export const disableVoucherByAdminAction = async (
  voucherId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const session = await requireAdmin();

    if (!session?.user?.id) {
      return ResponseFactory.error({ message: 'Unauthorized', code: 401 });
    }

    const result = await disableVoucherService(
      voucherId,
      session.user.id,
      true
    );

    return ResponseFactory.success({
      data: result,
      message: 'Voucher disabled successfully',
    });
  } catch (error) {
    return ResponseFactory.handleError(error);
  }
};
