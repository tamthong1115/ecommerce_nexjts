import { Phone, Video, MoreVertical, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatTopbarProps {
  recipientName: string;
  recipientImage?: string | null;
  role?: string;
}

export function ChatTopbar({
  recipientName,
  recipientImage,
  role,
}: ChatTopbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={recipientImage || ''} />
          <AvatarFallback>{recipientName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{recipientName}</h3>
            {role === 'admin' && (
              <Badge variant="secondary" className="text-[10px] h-4">
                Admin
              </Badge>
            )}
            {role === 'shop' && (
              <Badge variant="outline" className="text-[10px] h-4">
                Seller
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Video className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <ShieldAlert className="mr-2 h-4 w-4" /> Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
