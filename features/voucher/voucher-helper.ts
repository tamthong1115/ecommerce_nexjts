import { fetchApi } from '@/lib/client-fetch';
import { VoucherDTO } from '@/features/voucher/types/voucher.dto';

async function fetchAllVouchers(): Promise<VoucherDTO[]> {
  const VOUCHER_API_ENDPOINT = '/api/vouchers';

  try {
    const res = await fetchApi<VoucherDTO[]>(VOUCHER_API_ENDPOINT, {
      cache: 'no-store',
    });
    if (!res.success) {
      console.error('API call failed:', res.code);
      return [];
    }
    return res.data as VoucherDTO[];
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return [];
  }
}

type RandomVouchers = {
  voucher1: string | null;
  voucher2: string | null;
};

export async function getTwoRandomVoucherCodes(): Promise<RandomVouchers> {
  const emptyResult: RandomVouchers = { voucher1: null, voucher2: null };

  try {
    const allVouchers = await fetchAllVouchers();

    const percentVouchers = allVouchers.filter((v) => v.type === 'PERCENT');
    const shippingVouchers = allVouchers.filter((v) => v.type === 'SHIPPING');

    if (percentVouchers.length === 0 || shippingVouchers.length === 0) {
      console.warn('Thiếu ít nhất 1 voucher PERCENT hoặc SHIPPING.');
      return emptyResult;
    }

    const percentMaxIndex = percentVouchers.length;
    const percentIndex = Math.floor(Math.random() * percentMaxIndex);
    const randomPercentCode = percentVouchers[percentIndex].code;

    const shippingMaxIndex = shippingVouchers.length;
    const shippingIndex = Math.floor(Math.random() * shippingMaxIndex);
    const randomShippingCode = shippingVouchers[shippingIndex].code;

    return {
      voucher1: randomPercentCode,
      voucher2: randomShippingCode,
    };
  } catch (error) {
    console.error('Lỗi trong logic voucher:', error);
    return emptyResult;
  }
}
