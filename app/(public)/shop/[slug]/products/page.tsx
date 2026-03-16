'use client';
import { Loading } from '@/components/loading';
import { ProductItem } from '@/features/public/components/product-item';
import { fetchData } from '@/funcs/fetch';
import { paths } from '@/lib/path';
import {
  productDataResponse,
  productItemType,
} from '@/types/public.data-types';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Pagination from '../../../../../components/custom/pagination';

const ShopProduct = () => {
  const searchParams = useSearchParams();
  const [data, setData] = useState<productDataResponse | null>(null);
  const [nextPage, setNextPage] = useState<number>(1);
  const t = useTranslations('shop_product_page');
  const filter = searchParams.get('filter');
  const id = searchParams.get('id');

  useEffect(() => {
    fetchData({
      baseUrl: paths.shop.fetch_all,
      params: {
        shopId: id,
        filter: filter,
        page: nextPage,
        limit: 20,
      },
      setData: setData,
    });
  }, [nextPage]);

  const titlePage = useMemo(() => {
    if (filter === 'new') return 't_title_new';
    if (filter === 'top') return 't_title_top';
    return 't_title_all';
  }, [filter]);

  if (!data)
    return <Loading className="w-full flex justify-center items-center" />;

  return (
    <div className="h-fit flex flex-col justify-center items-center gap-3">
      <p className="w-fit text-nowrap font-semibold text-primary">
        {t(titlePage)}
      </p>
      <div className="w-full grid grid-cols-5 gap-3">
        {data.data.map((value: productItemType, index) => (
          <ProductItem key={index} item={value} />
        ))}
      </div>
      <Pagination
        current={data.pagination.page}
        total={data.pagination.totalPages}
        setNext={setNextPage}
      />
    </div>
  );
};
export default ShopProduct;
