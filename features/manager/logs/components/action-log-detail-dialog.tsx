'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Copy, User as UserIcon } from 'lucide-react';
import { ActionLogItem } from '../services/action-log.service';

interface ActionLogDetailDialogProps {
  log: ActionLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionLogDetailDialog({
  log,
  open,
  onOpenChange,
}: ActionLogDetailDialogProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!log) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatJson = (data: unknown) => {
    if (!data) return 'null';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const oldDataStr = formatJson(log.oldData);
  const newDataStr = formatJson(log.newData);
  const metadataStr = formatJson(log.metadata);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold">
              Chi tiết thao tác: {log.actionCode}
            </DialogTitle>
            <Badge variant="outline">{log.actionType}</Badge>
          </div>
          <DialogDescription>
            ID: <span className="font-mono text-xs">{log.id}</span> •{' '}
            {new Date(log.createdAt).toLocaleString('vi-VN')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
          <div>
            <span className="text-muted-foreground block">Người thực hiện</span>
            <div className="flex items-center gap-1.5 mt-1 font-medium">
              <Avatar className="h-5 w-5">
                <AvatarImage src={log.actor?.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {log.actor?.name?.[0]?.toUpperCase() || <UserIcon className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{log.actor?.name || log.actor?.email || 'Hệ thống'}</span>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block">Đối tượng tác động</span>
            <span className="font-medium mt-1 block truncate">
              {log.targetTable || 'N/A'} {log.targetId ? `(#${log.targetId.slice(0, 8)})` : ''}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block">Địa chỉ IP</span>
            <span className="font-medium mt-1 block font-mono">
              {log.actorIp || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block">Nguồn thao tác</span>
            <span className="font-medium mt-1 block">
              {log.actionSource || 'API'}
            </span>
          </div>
        </div>

        <Tabs defaultValue={log.newData ? 'newData' : 'oldData'} className="flex-1 flex flex-col min-h-0 mt-2">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="newData">Dữ liệu mới</TabsTrigger>
              <TabsTrigger value="oldData">Dữ liệu cũ</TabsTrigger>
              {log.metadata && <TabsTrigger value="metadata">Metadata</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="newData" className="flex-1 min-h-0 relative mt-2">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 z-10"
              onClick={() => handleCopy(newDataStr, 'newData')}
            >
              {copiedKey === 'newData' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <ScrollArea className="h-[280px] w-full rounded-md border bg-muted/20 p-3">
              <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all">
                {newDataStr}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="oldData" className="flex-1 min-h-0 relative mt-2">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 z-10"
              onClick={() => handleCopy(oldDataStr, 'oldData')}
            >
              {copiedKey === 'oldData' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <ScrollArea className="h-[280px] w-full rounded-md border bg-muted/20 p-3">
              <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all">
                {oldDataStr}
              </pre>
            </ScrollArea>
          </TabsContent>

          {log.metadata && (
            <TabsContent value="metadata" className="flex-1 min-h-0 relative mt-2">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7 z-10"
                onClick={() => handleCopy(metadataStr, 'metadata')}
              >
                {copiedKey === 'metadata' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <ScrollArea className="h-[280px] w-full rounded-md border bg-muted/20 p-3">
                <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all">
                  {metadataStr}
                </pre>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
