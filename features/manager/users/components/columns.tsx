import { userItemData } from '@/types/manager.data-types';
import { ColumnDef } from '@tanstack/react-table';
import { UseColumnsProps } from '../../_types/types';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCellViewer } from './table-cell-viewer';
import { Badge } from '@/components/ui/badge';
import { FiXCircle } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import { formatDay } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { IconDotsVertical, IconGripVertical } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';

export const useUserColumns = ({
  t,
  g,
  setIsReset,
  handleCopy,
}: UseColumnsProps): ColumnDef<userItemData>[] => {
  return React.useMemo(
    () => [
      {
        id: 'drag',
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: t('t_user_name'),
        header: t('t_user_name'),
        cell: ({ row }) => {
          return (
            <TableCellViewer item={row.original} setIsReset={setIsReset} />
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: t('t_email'),
        header: () => <div className="w-fit text-right">{t('t_email')}</div>,
        cell: ({ row }) => (
          <div className="w-full text-right">{row.original.email}</div>
        ),
      },
      {
        accessorKey: t('t_email_verified'),
        header: t('t_email_verified'),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.emailVerified === false ? (
              <FiXCircle className="fill-red-500 dark:fill-red-400" />
            ) : (
              <FaCheckCircle className="fill-green-500 dark:fill-green-400" />
            )}
            {row.original.emailVerified === true
              ? t('t_verified')
              : t('t_no_verified')}
          </Badge>
        ),
      },

      {
        accessorKey: t('t_created_at'),
        header: t('t_created_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32 overflow-hidden">
              {formatDay(row.original.createdAt)}
            </div>
          );
        },
      },
      {
        accessorKey: t('t_updated_at'),
        header: t('t_updated_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32 overflow-hidden">
              {formatDay(row.original.updatedAt)}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem className="flex justify-center items-center">
                <Button
                  variant={'ghost'}
                  className="text-left"
                  type="button"
                  onClick={() => handleCopy(row.original.id)}
                >
                  {t('t_copy_action')}
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                {t('t_del_action')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleCopy, setIsReset, t]
  );
};

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}
