'use client';

import { EmptyState } from '@/app/(public)/(customer)/customer/account/orders/_components/no-order-found';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { getOrder } from '@/app/actions/order';
import { $Enums } from '@/lib/generated/prisma';
import OrderStatus = $Enums.OrderStatus;
import { Loading } from '@/components/loading';

import { useTranslations } from 'next-intl';

import { OrderDTO } from '@/types/dtos/order.dto';
import { OrderCardItem } from '@/app/(public)/(customer)/customer/account/orders/_components/order-card-item';

export default function OrderPage() {
  const t = useTranslations('customer.orders');
  const c = useTranslations('general');
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [isPendingTransition, startTransition] = useTransition();
  const [data, dispatch, isPending] = useActionState<
    { orders: OrderDTO[]; nextCursor?: string },
    { cursor?: string; status?: OrderStatus; orderId?: string }
  >(getOrder, { orders: [], nextCursor: undefined });

  useEffect(() => {
    startTransition(() => {
      dispatch({
        status: status === 'ALL' ? undefined : (status as OrderStatus),
        cursor: undefined,
      });
    });
  }, [status]);

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loading />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      );
    }

    if (data.orders.length === 0) {
      return (
        <div className="py-16">
          <EmptyState
            imageSrc="/empty-order.png"
            title={t('empty_title')}
          />
        </div>
      );
    }

    return (
      <ul className="space-y-4">
        {data.orders.map((o) => (
          <OrderCardItem key={o.id} o={o} t={t} />
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* TABS */}
      <div className="flex w-full flex-col gap-6">
        <Tabs
          defaultValue="ALL"
          value={status}
          onValueChange={(val) => setStatus(val as any)}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap bg-primary/30 p-1 rounded-xl shadow-inner">
            <TabsTrigger
              value="ALL"
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.all')}
            </TabsTrigger>
            <TabsTrigger
              value={OrderStatus.AWAITING_PAYMENT}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.awaiting_payment')}
            </TabsTrigger>
            <TabsTrigger
              value={OrderStatus.PROCESSING}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.processing')}
            </TabsTrigger>
            <TabsTrigger
              value={OrderStatus.SHIPPED}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.shipped')}
            </TabsTrigger>
            <TabsTrigger
              value={OrderStatus.DELIVERED}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.delivered')}
            </TabsTrigger>
            <TabsTrigger
              value={OrderStatus.CANCELED}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {t('tabs.canceled')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={status} className="mt-6 w-full">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
