'use client';

import { MessageRole } from '@/lib/generated/prisma';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { env } from '@/lib/env';
import Pusher from 'pusher-js';
import { ConversationWithMessages } from '@/app/data/chat.data';
import { ChatTopbar } from './chat-topbar';
import { MessageBubble } from '@/features/shared/components/chat/message-bubble';

interface ChatAreaProps {
  conversationId: string;
  currentUser: {
    id: string;
    globalRole: string; // user, seller, admin
  };
  actingAs: {
    role: MessageRole; // USER, SHOP, ADMIN
    shopId?: string | null;
  };
  recipient: {
    name: string;
    image?: string | null;
    type?: string;
  };
  initialMessages: ConversationWithMessages;
}

type MessageItem = ConversationWithMessages[number];

export function ChatArea({
  conversationId,
  currentUser,
  actingAs,
  recipient,
  initialMessages,
}: ChatAreaProps) {
  const [messages, setMessages] =
    useState<ConversationWithMessages>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const pusher = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`private-chat-${conversationId}`);
    channel.bind('new-message', (newMsg: MessageItem) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      pusher.unsubscribe(`private-chat-${conversationId}`);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(
        conversationId,
        input,
        actingAs.role,
        actingAs.shopId || undefined
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setInput('');
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50/50">
      <ChatTopbar
        recipientName={recipient.name}
        recipientImage={recipient.image}
        role={recipient.type}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col min-h-full justify-end">
          {messages.map((msg) => {
            // User, Shop, Admin
            let isMe = false;

            if (actingAs.role === MessageRole.SHOP) {
              isMe = msg.senderShopId === actingAs.shopId;
            } else {
              isMe =
                msg.senderUserId === currentUser.id &&
                msg.senderRole === actingAs.role;
            }

            const senderName = msg.senderShop
              ? msg.senderShop.name
              : msg.senderUser?.name;
            const senderImage = msg.senderShop
              ? msg.senderShop.logoUrl
              : msg.senderUser?.image;
            return (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                senderRole={msg.senderRole}
                senderName={senderName}
                senderImage={senderImage}
                createdAt={msg.createdAt}
                isMe={isMe}
                type={msg.type}
                relatedProduct={msg.relatedProduct || null}
                relatedOrder={msg.relatedOrder || null}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full pr-12 bg-muted/50 border-none shadow-sm"
          />
          <Button
            variant="ghost"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 border-none bg-transparent text-muted-foreground hover:bg-transparent focus:ring-0 focus:ring-offset-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
