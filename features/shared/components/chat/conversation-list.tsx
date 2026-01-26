'use client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/public/logo.jpg';
import { formatDistanceToNow } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ConversationItem = {
  id: string;
  updatedAt: Date;
  lastMessage: string;
  recipient: {
    name?: string | null;
    image?: string | null;
    id?: string;
  };
};

type ConversationListProps = {
  conversations: ConversationItem[];
  baseUrl?: string;
};

export function ConversationList({
  conversations,
  baseUrl = '/messages',
}: ConversationListProps) {
  const params = useParams();
  const activeId = params?.id as string;

  return (
    <div className="w-full md:w-80 flex flex-col border-r h-full">
      <div className="flex flex-col  p-4  font-bold ">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <Link href="/" aria-label="Go to homepage" className="inline-block">
            <Image
              src={Logo}
              alt="App logo"
              className="w-18 h-6 cursor-pointer"
            />
          </Link>
        </div>
        {/* Header & Search */}
        <div className="pt-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-8 bg-muted/50" />
          </div>
        </div>
      </div>

      <Separator />
      <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversations.map((chat) => {
            const isActive = activeId === chat.id;
            const chatUrl = `${baseUrl}/${chat.id}`;
            return (
              <Link
                href={chatUrl}
                key={chat.id}
                className={`flex items-center gap-3 p-4 hover:bg-muted/10 transition cursor-pointer ${
                  activeId === chat.id
                    ? 'bg-muted border-r-4 border-primary'
                    : ''
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={chat.recipient.image || ''} />
                  <AvatarFallback className="uppercase">
                    {chat.recipient.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>

                {/*  Info */}
                <div className="flex flex-col w-full overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'font-semibold text-sm',
                        isActive ? 'text-foreground' : 'text-foreground'
                      )}
                    >
                      {chat.recipient.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(chat.updatedAt), {
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs truncate mt-1',
                      isActive ? 'text-foreground/80' : 'text-muted-foreground'
                    )}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
              </Link>
            );
          })}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No conversations yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
