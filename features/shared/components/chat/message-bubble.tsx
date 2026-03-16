import { MessageRole, MessageType } from '@/lib/generated/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Store } from 'lucide-react';
import { RenderBubbleContent } from '@/features/shared/components/chat/render-bubble-content';

export interface ProductData {
  id: string;
  title: string;
  minPrice: number;
  maxPrice: number;
  images: { url: string }[];
  slug: string;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
}

interface MessageProps {
  content: string;
  senderRole: MessageRole;
  senderName?: string | null;
  senderImage?: string | null;
  createdAt: Date;
  isMe: boolean;
  type?: MessageType; // 'TEXT' | 'PRODUCT_CARD' | 'ORDER_CARD'
  relatedProduct?: ProductData | null;
  relatedOrder?: OrderData | null;
}

export function MessageBubble({
  content,
  senderRole,
  senderName,
  senderImage,
  createdAt,
  isMe,
  type,
  relatedProduct,
  relatedOrder,
}: MessageProps) {
  const isSystemAdmin = senderRole === MessageRole.ADMIN;
  const isShop = senderRole === MessageRole.SHOP;
  const isImage = type === MessageType.IMAGE;

  // console.log('isMe', isMe);

  return (
    <div
      className={cn(
        'flex w-full gap-3 mb-4',
        isMe ? 'justify-end' : 'justify-start'
      )}
    >
      {/*  Avatar */}
      {!isMe && (
        <Avatar
          className={cn(
            'h-8 w-8 mt-1 border',
            isSystemAdmin && 'border-yellow-400 ring-2 ring-yellow-100'
          )}
        >
          <AvatarImage src={senderImage || ''} />
          <AvatarFallback
            className={isSystemAdmin ? 'bg-yellow-100 text-yellow-700' : ''}
          >
            {senderName?.[0]}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex flex-col max-w-[75%]',
          isMe ? 'items-end' : 'items-start'
        )}
      >
        {!isMe && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {senderName}
            </span>

            {isSystemAdmin && (
              <Badge
                variant="outline"
                className="h-5 px-1 bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Admin Support
              </Badge>
            )}

            {isShop && (
              <Badge
                variant="outline"
                className="h-5 px-1 bg-blue-50 text-blue-700 border-blue-200 gap-1"
              >
                <Store className="w-3 h-3" /> Seller
              </Badge>
            )}
          </div>
        )}

        {/* The Message Bubble Container */}
        <div
          className={cn(
            // 1. Base styles
            'overflow-hidden relative',

            // 2. Image styles: No background, no shadow (image handles its own border)
            isImage
              ? 'p-0 bg-transparent border-0 shadow-none'
              : 'shadow-sm text-foreground',

            // 3. Text/Card styles (Only applied if NOT an image)
            !isImage &&
              (type === 'PRODUCT_CARD' || type === 'ORDER_CARD'
                ? 'bg-card border border-border rounded-xl'
                : cn(
                    'px-4 py-2 text-sm rounded-2xl',
                    isMe
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-card border border-border'
                  )),

            // 4. Admin warning style
            !isImage &&
              type === 'TEXT' &&
              isSystemAdmin &&
              !isMe &&
              'bg-warning/10 border-warning/20 text-foreground'
          )}
        >
          <RenderBubbleContent
            content={content}
            type={type}
            relatedProduct={relatedProduct}
            relatedOrder={relatedOrder}
          />
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
