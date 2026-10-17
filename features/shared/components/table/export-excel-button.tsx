'use client';

import React, { useState } from 'react';
import { Table as TanstackTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  exportTableToExcel,
  ExportTableToExcelOptions,
} from '@/features/shared/utils/export-table-to-excel';

export interface ExportExcelButtonProps<TData>
  extends ExportTableToExcelOptions<TData> {
  table: TanstackTable<TData>;
  className?: string;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  disabled?: boolean;
}

export function ExportExcelButton<TData>({
  table,
  filename,
  sheetName,
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Export Excel',
  disabled = false,
  ...rest
}: ExportExcelButtonProps<TData>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportTableToExcel(table, {
        filename,
        sheetName,
        ...rest,
      });
    } catch (err: any) {
      console.error('Failed to export excel:', err);
      toast.error(err?.message || 'Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting || disabled}
      className={`flex items-center gap-1.5 hover:cursor-pointer ${className ?? ''}`}
    >
      {isExporting ? (
        <IconLoader2 className="animate-spin size-4" />
      ) : (
        <IconDownload className="size-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

