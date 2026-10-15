'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, User as UserIcon } from 'lucide-react';
import { ActionLogItem } from '../services/action-log.service';
import { ActionType } from '@prisma/client';

const ACTION_TYPE_STYLES: Record<
  ActionType,
  { label: string; className: string }
> = {
  CREATE: {
    label: 'Tạo mới',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  },
  UPDATE: {
    label: 'Cập nhật',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  },
  DELETE: {
    label: 'Xóa',
    className: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
  },
  RESTORE: {
    label: 'Khôi phục',
    className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  },
  IMPORT: {
    label: 'Nhập file',
    className: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  },
  EXPORT: {
    label: 'Xuất file',
    className: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  },
  READ: {
    label: 'Đọc/Xem',
    className: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800',
  },
  EXECUTE: {
    label: 'Thực thi',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  },
};

export function getActionLogColumns({
  onViewDetail,
}: {
  onViewDetail: (log: ActionLogItem) => void;
}): ColumnDef<ActionLogItem>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'actor',
      header: 'Người thực hiện',
      cell: ({ row }) => {
        const actor = row.original.actor;
        if (!actor) {
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
              Hệ thống
            </Badge>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={actor.image || undefined} />
              <AvatarFallback className="text-[10px]">
                {actor.name?.[0]?.toUpperCase() || <UserIcon className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium leading-none truncate max-w-[140px]">
                {actor.name || 'Chưa đặt tên'}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                {actor.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'actionType',
      header: 'Loại thao tác',
      cell: ({ row }) => {
        const type = row.original.actionType;
        const config = ACTION_TYPE_STYLES[type] || {
          label: type,
          className: 'bg-muted text-muted-foreground',
        };
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'actionCode',
      header: 'Mã hành động',
      cell: ({ row }) => (
        <code className="text-xs font-mono font-semibold text-foreground/90 bg-muted/60 px-1.5 py-0.5 rounded">
          {row.original.actionCode}
        </code>
      ),
    },
    {
      accessorKey: 'targetTable',
      header: 'Đối tượng tác động',
      cell: ({ row }) => {
        const { targetTable, targetId, metadata } = row.original;
        const meta = metadata as Record<string, any> | null;
        if (meta?.recipient) {
          return (
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground truncate max-w-[180px]">
                {meta.recipient}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {meta.subject || targetTable}
              </span>
            </div>
          );
        }
        if (!targetTable) return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-foreground">{targetTable}</span>
            {targetId && (
              <span className="font-mono text-muted-foreground text-[11px]">
                #{targetId.slice(0, 8)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'actorIp',
      header: 'IP / Nguồn',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.actorIp || row.original.actionSource || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => onViewDetail(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Chi tiết</span>
        </Button>
      ),
    },
  ];
}
