'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { formatPrice, formatTime } from '@/lib/utils';
import { $Enums } from '@/lib/generated/prisma';
import { useTranslations } from 'next-intl';
import { VoucherResponseDTO } from '@/features/voucher/types/voucher.dto';
import VoucherType = $Enums.VoucherType;
import { disableVoucherByAdminAction } from '@/features/voucher/server/controller/voucher.action';
import { useTransition } from 'react';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  FIXED: 'bg-info/15 text-info border-info border-2',
  SHIPPING: 'bg-success/15 text-success border-success border-2',
  PERCENT: 'bg-error/15 text-error border-error border-2',
};

export const columns = (
  t: ReturnType<typeof useTranslations>,
  onUpdateSuccess: () => void
): ColumnDef<VoucherResponseDTO>[] => [
  {
    accessorKey: 'code',
    header: 'Voucher',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const s: VoucherType = row.getValue('type');
      return (
        <div className={`font-medium ${statusColor[s]} w-fit p-1 rounded-lg`}>
          {s}
        </div>
      );
    },
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue('type') === 'FIXED' ||
          row.getValue('type') === 'SHIPPING'
            ? formatPrice(row.getValue('value') as number)
            : `${row.getValue('value')}%`}
        </div>
      );
    },
  },
  {
    accessorKey: 'startAt',
    header: 'Start',
    cell: ({ row }) => {
      return (
        <div className="font-normal">
          {formatTime(row.getValue('startAt') as string)}
        </div>
      );
    },
  },
  {
    accessorKey: 'endAt',
    header: 'End',
    cell: ({ row }) => {
      return (
        <div className="font-normal">
          {formatTime(row.getValue('endAt') as string)}
        </div>
      );
    },
  },
  {
    accessorKey: 'usageLimit',
    header: 'Limit',
  },
  {
    accessorKey: 'isActive',
    header: 'isActive',
    cell: ({ row }) => {
      return (
        <div
          className={`font-semibold ${row.getValue('isActive') === true ? 'text-success' : 'text-error'}`}
        >
          {row.getValue('isActive') === true ? 'V' : 'X'}
        </div>
      );
    },
  },
  {
    header: 'actions',
    id: 'actions',
    cell: ({ row }) => {
      const voucher = row.original;
      const [isPending, startTransition] = useTransition();

      const handleDisable = () => {
        startTransition(async () => {
          const result = await disableVoucherByAdminAction(voucher.id);

          if (result.success) {
            toast.success(result.message || 'Voucher disabled successfully');
            onUpdateSuccess();
          } else {
            toast.error(result.message || 'Failed to disable voucher');
          }
        });
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {voucher.isActive && (
              <>
                <DropdownMenuItem onClick={handleDisable} disabled={isPending}>
                  {isPending ? 'Disabling...' : 'Disable'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
