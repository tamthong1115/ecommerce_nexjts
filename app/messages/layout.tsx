import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserOrShopConversations } from '@/app/data/chat.data';
import { ConversationList } from '@/features/shared/components/chat/conversation-list';

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const conversations = await getUserOrShopConversations(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background-secondary">
      <div className="w-80 border-r h-full">
        <ConversationList conversations={conversations} />
      </div>

      <main className="flex-1 h-full overflow-y-auto relative">{children}</main>
    </div>
  );
}
