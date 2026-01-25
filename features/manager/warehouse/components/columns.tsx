import { formatDay, LocaleType } from '@/lib/utils';
import { Checkbox } from '@radix-ui/react-checkbox';
import { IconDotsVertical, IconGripVertical } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { FaLock, FaLockOpen } from 'react-icons/fa';
import { FiTool } from 'react-icons/fi';
import { handleDelete } from '../../category/funcs/funcs';
import { useSortable } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { TableCellViewer } from './table-cell-viewer';
import { Badge } from '@/components/ui/badge';
import { IoFileTrayFull } from 'react-icons/io5';
import { warehouseData } from '@/types/manager.data-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UseColumnsProps } from '../../_types/types';
import { paths } from '@/lib/path';

export const useWarehouseColumns = ({
  t,
  g,
  n,
  setIsReset,
  handleCopy,
}: UseColumnsProps): ColumnDef<warehouseData>[] => {
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
        accessorKey: t('t_warehouse_name'),
        header: t('t_warehouse_name'),
        cell: ({ row }) => {
          return (
            <TableCellViewer item={row.original} setIsReset={setIsReset} />
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: t('t_region'),
        header: t('t_region'),
        cell: ({ row }) => (
          <div className="w-full flex flex-row gap-2 justify-start items-center">
            <div>{row.original.region}</div>
          </div>
        ),
      },
      {
        accessorKey: t('t_status'),
        header: t('t_status'),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.status === 'OPEN' ? (
              <FaLockOpen
                size={20}
                className={'text-green-700 dark:text-green-600'}
              />
            ) : row.original.status === 'CLOSED' ? (
              <FaLock size={20} className="text-red-700 dark:text-green-600" />
            ) : row.original.status === 'FULL' ? (
              <IoFileTrayFull
                size={20}
                className="text-amber-700 dark:text-amber-600"
              />
            ) : (
              <FiTool size={20} className="text-gray-700 dark:text-gray-600" />
            )}
            {t('t_tab_' + row.original.status.toLowerCase())}
          </Badge>
        ),
      },
      {
        accessorKey: t('t_created_at'),
        header: t('t_created_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32">
              {formatDay(
                row.original.createdAt.toString(),
                g('t_region') as LocaleType
              )}
            </div>
          );
        },
      },
      {
        accessorKey: t('t_updated_at'),
        header: t('t_updated_at'),
        cell: ({ row }) => {
          return (
            <div className="w-32">
              {formatDay(
                row.original.updatedAt.toString(),
                g('t_region') as LocaleType
              )}
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
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8 hover:cursor-pointer"
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
                  className="text-left hover:cursor-pointer"
                  onClick={() => handleCopy(row.original.id)}
                >
                  {g('t_copy_action')}
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex justify-center items-center p-0">
                <Button
                  variant={'destructive'}
                  className="text-left w-full hover:cursor-pointer"
                  onClick={() =>
                    handleDelete({
                      url: paths.manager.warehouse.del_one(row.original.id),
                      setIsReset: setIsReset,
                      t: n,
                    })
                  }
                >
                  {g('t_del_action')}
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [g, handleCopy, n, setIsReset, t]
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
