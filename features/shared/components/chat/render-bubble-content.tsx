import { MessageType } from '@/lib/generated/prisma';
import ProductIconPlaceholder from '@/public/product-icon-placeholder.svg';
import Link from 'next/link';
import { paths } from '@/lib/path';
import Image from 'next/image';
import { Badge, Package, ZoomIn } from 'lucide-react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OrderData, ProductData } from './message-bubble';

interface RenderBubbleContentProps {
  content: string;
  type?: MessageType; // 'TEXT' | 'PRODUCT_CARD' | 'ORDER_CARD'
  relatedProduct?: ProductData | null;
  relatedOrder?: OrderData | null;
}

export function RenderBubbleContent({
  content,
  type,
  relatedProduct,
  relatedOrder,
}: RenderBubbleContentProps) {
  if (type === MessageType.PRODUCT_CARD && relatedProduct) {
    const image = relatedProduct.images[0]?.url || ProductIconPlaceholder;
    return (
      <div className="flex flex-col">
        <Link
          href={paths.products.detail_id(relatedProduct.id)}
          className="flex gap-3 bg-muted/30 p-2 rounded-t-lg border-b border-border hover:bg-muted/50 transition-colors"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-card">
            <Image
              src={image}
              alt={relatedProduct.title}
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="text-xs font-medium line-clamp-1 text-foreground">
              {relatedProduct.title}
            </p>
            <p className="text-sm font-semibold text-primary">
              {relatedProduct.minPrice === relatedProduct.maxPrice
                ? `$${relatedProduct.minPrice.toFixed(2)}`
                : `$${relatedProduct.minPrice.toFixed(
                    2
                  )} - $${relatedProduct.maxPrice.toFixed(2)}`}
            </p>
          </div>
        </Link>
        {/* The user's message attached to the card */}
        <div className="px-3 py-2 text-sm">{content}</div>
      </div>
    );
  }

  if (type === MessageType.ORDER_CARD && relatedOrder) {
    return (
      <div className="flex flex-col min-w-[200px]">
        <Link href={paths.orders.order_detail_customer(relatedOrder.id)}>
          <div className="bg-info/10 p-2.5 rounded-t-lg border-b border-info/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-info" />
              <span className="text-xs font-bold text-info">
                Order #{relatedOrder.orderNumber}
              </span>
            </div>
            <Badge className="text-[10px] h-4 px-1 bg-card">
              {relatedOrder.status}
            </Badge>
          </div>
          <div className="bg-muted/30 p-2 text-xs flex justify-between border-b border-border">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">
              {Number(relatedOrder.grandTotal).toLocaleString()} ₫
            </span>
          </div>
        </Link>
        <div className="px-3 py-2 text-sm">{content}</div>
      </div>
    );
  }

  if (type === MessageType.IMAGE) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/20">
            {/* 1. Constraints: max-w-[280px] prevents it from being too wide.
               2. max-h-[300px] prevents it from being too tall (portrait).
            */}
            <Image
              src={content}
              alt="Attachment"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto max-w-[280px] max-h-[300px] object-contain"
            />

            {/* Optional: Overlay on hover to show it's clickable */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="text-white w-8 h-8 drop-shadow-md" />
            </div>
          </div>
        </DialogTrigger>

        {/* The Full Screen Modal */}
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <Image
              src={content}
              alt="Full preview"
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="px-3 py-2 text-sm">{content}</div>;
}
