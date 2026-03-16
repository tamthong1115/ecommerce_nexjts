import { voucherController } from '@/features/voucher/server/controller/voucher.route';

export const GET = voucherController.getVouchers;

export const POST = voucherController.createVoucher;
