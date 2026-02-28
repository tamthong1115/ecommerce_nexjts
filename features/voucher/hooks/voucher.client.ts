import { fetchApi } from '@/lib/client-fetch';
import { VoucherResponseData } from '@/features/voucher/types/voucher.dto';
import { CreateVoucherInput } from '@/features/voucher/validation';
import { paths } from '@/lib/path';

export type VoucherFetchScope = 'public' | 'seller' | 'manager';

interface GetVouchersParams {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  shopId?: string;
  isActive?: boolean;
}

export const getVouchers = async (
  params: GetVouchersParams,
  isManager = false
) => {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.append('page', params.page.toString());
  urlSearchParams.append('limit', params.limit.toString());
  if (params.search) urlSearchParams.append('search', params.search);
  if (params.type && params.type !== 'all')
    urlSearchParams.append('type', params.type);
  if (params.shopId && params.shopId !== 'all')
    urlSearchParams.append('shopId', params.shopId);
  if (params.isActive !== undefined)
    urlSearchParams.append('isActive', String(params.isActive));

  const endpoint = isManager
    ? paths.voucher.manager_list
    : paths.voucher.seller_list;

  return await fetchApi<VoucherResponseData>(
    `${endpoint}?${urlSearchParams.toString()}`,
    {
      cache: 'no-store',
    }
  );
};
export const createVoucher = async (data: CreateVoucherInput) => {
  return await fetchApi(paths.voucher.public, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
