import {
  getConversationMessages,
  getUserOrShopConversations,
} from '@/app/data/chat.data';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getShopIdByUserId } from '@/app/data/shop.data';
import { Role } from '@/lib/generated/prisma';
import { ChatArea } from '@/features/shared/components/chat/chat-area';

type MessagePageParams = {
  conversationId: string;
};

export default async function MessageSellerPage({
  params,
}: {
  params: Promise<MessagePageParams>;
}) {
  const { conversationId } = await params;

  const session = await getSessionUser();
  if (!session) redirect('/login');
  const shopId = await getShopIdByUserId(session.user.id);

  const messages = await getConversationMessages(conversationId);

  const conversations = await getUserOrShopConversations(
    session.user.id,
    shopId
  );

  const activeConv = conversations.find((c) => c.id === conversationId);

  if (!activeConv) return <div>Conversation not found</div>;

  return (
    <ChatArea
      conversationId={conversationId}
      currentUser={{
        id: session.user.id,
        globalRole: session.user.role ?? Role.user,
      }}
      actingAs={{ role: 'SHOP', shopId }}
      recipient={{
        name: activeConv.recipient.name || 'Unknown',
        image: activeConv.recipient.image,
      }}
      initialMessages={messages}
    />
  );
}
