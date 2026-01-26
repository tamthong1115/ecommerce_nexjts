'use client';

import { OrderDetails } from '@/app/data/order.data';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { ChatButton } from '@/features/shared/components/chat/chat-button';

interface OrderDetailClientProps {
  order: OrderDetails;
}

const getStatusLabel = (status: string, t: (k: string) => string) => {
  switch (status) {
    case 'PENDING':
      return t('status.pending');
    case 'PAID':
      return t('status.paid');
    case 'PROCESSING':
      return t('status.processing');
    case 'SHIPPED':
      return t('status.shipped');
    case 'DELIVERED':
      return t('status.delivered');
    case 'CANCELED':
      return t('status.canceled');
    case 'REFUNDED':
      return t('status.refunded');
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return 'text-success';
    case 'CANCELED':
      return 'text-destructive';
    case 'PENDING':
      return 'text-warning';
    default:
      return 'text-info';
  }
};

interface AddressJson {
  fullName: string;
  phone: string;
  line1: string;
  ward?: string;
  district?: string;
  city: string;
  country?: string;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const shippingAddress = order.shippingAddress as unknown as AddressJson;
  const paymentMethod = order.payments?.[0]?.method || 'Cash on Delivery (COD)';
  const t = useTranslations('customer.orders');

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            href={'/customer/account/orders'}
            className="text-sm text-info hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="h-5 w-5" /> {t('back_to_orders')}
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-medium text-foreground">
              {t('detail_title')} #{order.orderNumber} -{' '}
              <span className={getStatusColor(order.status)}>
                {getStatusLabel(order.status, t)}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('placed_on')}{' '}
              {format(new Date(order.placedAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {/* Main Action */}
          <div className="mt-4 md:mt-0">
            <Button className="bg-warning text-warning-foreground hover:bg-warning/90 border-none font-normal">
              {t('buttons.track_order')}
            </Button>
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Receiver Address */}
          <Card className="shadow-sm border-none h-full bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                {t('shipping_address')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-semibold text-foreground">
                {shippingAddress?.fullName}
              </p>
              <p className="text-muted-foreground">
                {shippingAddress?.line1}, {shippingAddress?.ward},{' '}
                {shippingAddress?.district}
              </p>
              <p className="text-muted-foreground">{shippingAddress?.city}</p>
              <p className="text-muted-foreground mt-2">
                {t('phone')}: {shippingAddress?.phone}
              </p>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card className="shadow-sm border-none h-full bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                {t('delivery_method')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="bg-warning/20 text-warning hover:bg-warning/30 border-none rounded px-1.5 py-0 text-[10px] uppercase font-bold"
                >
                  {t('delivery_fast')}
                </Badge>
                <span className="font-medium text-foreground">
                  {t('delivery_economy')}
                </span>
              </div>
              <p className="text-muted-foreground">
                {t('fulfilled_by')}{' '}
                {order.shipments?.[0]?.carrier || t('smart_logistics')}
              </p>
              <p className="text-muted-foreground">
                {t('shipping_fee')}: {formatPrice(order.shippingFee)}
              </p>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow-sm border-none h-full bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                {t('payment_method')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-foreground font-medium">{paymentMethod}</p>
              <p
                className={`text-xs ${order.paymentStatus === 'PAID' ? 'text-success' : 'text-muted-foreground'}`}
              >
                {order.paymentStatus === 'PAID'
                  ? t('status_paid')
                  : t('status_cod')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Items List */}
        <Card className="shadow-sm border-none mb-6 bg-card">
          {/* Shop Header */}
          {order.shop && (
            <div className="px-6 py-3 border-b border-border flex items-center gap-2 bg-card rounded-t-lg">
              <div className="font-medium text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span>{order.shop.name}</span>
              </div>
              <ChatButton shopId={order.shop.id} order={order} />
            </div>
          )}

          <CardContent className="p-0">
            {order.items.map((item) => {
              const displayImage =
                item.variant?.image ||
                item.product.images?.[0]?.url ||
                '/placeholder.png';

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  {/* Image wrapper */}
                  <div className="relative w-20 h-20 flex-shrink-0 border border-border rounded-sm overflow-hidden bg-muted">
                    <Image
                      src={displayImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="space-y-1 pr-4">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="text-sm font-medium text-foreground hover:text-info line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        {item.variant?.name && (
                          <p className="text-xs text-muted-foreground">
                            {t('variation')}: {item.variant.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t('sold_by')}{' '}
                          <span className="text-info cursor-pointer">
                            {order.shop?.name || 'Tiki Trading'}
                          </span>
                        </p>

                        {/* Mobile Only Qty/Price */}
                        <div className="flex md:hidden items-center justify-between mt-2">
                          <p className="text-sm font-semibold text-foreground">
                            {formatPrice(item.unitPrice)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            x{item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Price/Qty columns */}
                      <div className="hidden md:flex items-center gap-8 text-right">
                        <div className="w-28">
                          <p className="font-medium text-sm text-foreground">
                            {formatPrice(item.unitPrice)}
                          </p>
                          {Number(item.discount) > 0 && (
                            <span className="text-xs line-through text-muted-foreground">
                              {formatPrice(
                                Number(item.unitPrice) + Number(item.discount)
                              )}
                            </span>
                          )}
                        </div>
                        <div className="w-12 text-center text-sm text-muted-foreground">
                          x{item.quantity}
                        </div>
                        <div className="w-28 font-bold text-sm text-foreground">
                          {formatPrice(item.total)}
                        </div>
                      </div>
                    </div>

                    {/* Item Actions */}
                    <div className="flex gap-2 mt-4 md:mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-info border-info/30 h-8 text-xs hover:bg-info/10 font-normal"
                      >
                        {t('buttons.buy_again')}
                      </Button>
                      {order.status === 'DELIVERED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-normal border-border hover:bg-muted"
                        >
                          {t('buttons.write_review')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Footer Summary Section */}
        <div className="flex flex-col md:flex-row gap-4 justify-end">
          <Card className="shadow-sm border-none w-full md:w-1/2 lg:w-1/3 ml-auto bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('summary.subtotal')}</span>
                <span className="text-foreground">
                  {formatPrice(order.itemsTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('summary.shipping_fee')}</span>
                <span className="text-foreground">
                  {formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('summary.shipping_discount')}</span>
                <span className="text-success">-0 ₫</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('summary.discount')}</span>
                <span className="text-success">
                  -{formatPrice(order.discountTotal)}
                </span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-medium text-foreground">
                  {t('summary.grand_total')}
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-destructive">
                    {formatPrice(order.grandTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground font-light">
                    {t('summary.vat_included')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
