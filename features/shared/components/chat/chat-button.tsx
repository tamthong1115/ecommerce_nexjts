'use client';

import { getOrCreateConversation, sendMessage } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface ChatButtonProps {
  shopId: string;
  product?: { id: string };
  order?: { orderNumber: string; id: string };
}

export function ChatButton({ shopId, product, order }: ChatButtonProps) {
  const router = useRouter();

  const handleChat = async () => {
    const { id: conversationId } = await getOrCreateConversation(shopId);

    if (product) {
      await sendMessage(
        conversationId,
        'I have a question about this product',
        'USER',
        undefined,
        product.id,
        undefined
      );
    }

    if (order) {
      await sendMessage(
        conversationId,
        `Inquiry about Order #${order.orderNumber}`,
        'USER',
        undefined,
        undefined,
        order.id
      );
    }

    router.push(`/messages/${conversationId}`);
  };

  const t = useTranslations('product_detail');

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto text-info border-info/30 hover:bg-info/10 h-8 text-xs font-medium hover:cursor-pointer"
      onClick={handleChat}
    >
      <MessageCircle className="w-3 h-3 mr-1" /> {t('t_chat_will_seller')}
    </Button>
  );
}
