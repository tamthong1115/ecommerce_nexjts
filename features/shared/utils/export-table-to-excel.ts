import { Table as TanstackTable } from '@tanstack/react-table';
import { colNumToLetter } from '@/lib/excel/operations/coord.utils';
import { EType, ColumnMapping, CellStyle } from '@/lib/excel/types';

export interface ExportTableToExcelOptions<TData> {
  filename?: string;
  sheetName?: string;
  excludeColumnIds?: string[];
  onlySelectedRows?: boolean;
  exportAllPages?: boolean;
  customData?: TData[];
  columnWidths?: Record<string, number>;
  headerBackground?: string;
}

/**
 * Converts camelCase or snake_case column ID to human-readable title
 */
function formatColumnTitle(id: string): string {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Determines appropriate Excel data type based on a sample of values
 */
function inferCellType(value: unknown): EType {
  if (value instanceof Date) return EType.DATE;
  if (typeof value === 'number') return EType.NUMBER;
  if (typeof value === 'boolean') return EType.BOOLEAN;
  if (typeof value === 'string') {
    // Check if ISO date string
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value) && !isNaN(Date.parse(value))) {
      return EType.DATE;
    }
  }
  return EType.TEXT;
}

/**
 * Dynamically exports TanStack Table content to an Excel file using /api/excel
 */
import { toast } from 'sonner';

function extractCellValue(row: any, col: any): unknown {
  let val: unknown = undefined;

  try {
    val = row.getValue(col.id);
  } catch {
    val = undefined;
  }

  const original = row.original as Record<string, any> | undefined;

  if ((val === undefined || val === null) && original) {
    val = original[col.id];
  }

  if ((val === undefined || val === null) && original) {
    const colIdLower = String(col.id).toLowerCase();
    const headerLower =
      typeof col.columnDef.header === 'string'
        ? col.columnDef.header.toLowerCase()
        : '';

    if (
      colIdLower.includes('shop') ||
      colIdLower.includes('cửa hàng') ||
      headerLower.includes('cửa hàng') ||
      headerLower.includes('shop')
    ) {
      val = original.shop?.name ?? original.shopName ?? original.shop?.title;
    } else if (
      colIdLower.includes('owner') ||
      colIdLower.includes('chủ') ||
      headerLower.includes('chủ')
    ) {
      val = original.owner?.name ?? original.ownerName;
    } else if (
      colIdLower.includes('user') ||
      colIdLower.includes('người dùng') ||
      headerLower.includes('người dùng')
    ) {
      val = original.user?.name ?? original.name;
    } else if (
      colIdLower.includes('visibility') ||
      colIdLower.includes('hiển thị') ||
      headerLower.includes('hiển thị')
    ) {
      val = original.visibility;
    } else if (
      colIdLower.includes('variant') ||
      colIdLower.includes('phiên bản') ||
      headerLower.includes('phiên bản')
    ) {
      val = original._count?.variants ?? original.variantCount;
    } else if (
      colIdLower.includes('children') ||
      colIdLower.includes('con') ||
      headerLower.includes('danh mục con')
    ) {
      val = original._count?.children ?? original.childrenCount;
    } else if (
      colIdLower.includes('status') ||
      colIdLower.includes('trạng thái') ||
      headerLower.includes('trạng thái')
    ) {
      val = original.status;
    } else if (
      colIdLower.includes('serial') ||
      colIdLower.includes('position') ||
      colIdLower.includes('thứ tự') ||
      headerLower.includes('thứ tự')
    ) {
      val = original.position ?? original.order ?? original.serial;
    } else if (
      colIdLower.includes('active') ||
      colIdLower.includes('hoạt động') ||
      headerLower.includes('hoạt động')
    ) {
      val =
        original.isActive !== undefined
          ? original.isActive
            ? 'Có'
            : 'Không'
          : undefined;
    } else if (
      colIdLower.includes('verified') ||
      colIdLower.includes('xác thực') ||
      headerLower.includes('xác thực')
    ) {
      val =
        original.emailVerified !== undefined
          ? original.emailVerified
            ? 'Đã xác thực'
            : 'Chưa xác thực'
          : undefined;
    } else if (colIdLower.includes('email')) {
      val = original.email;
    } else if (
      colIdLower.includes('rating') ||
      colIdLower.includes('đánh giá') ||
      headerLower.includes('đánh giá')
    ) {
      val =
        original.ratingAvg !== undefined
          ? original.ratingCount !== undefined
            ? `${original.ratingAvg} (${original.ratingCount})`
            : original.ratingAvg
          : original.rating;
    } else if (
      colIdLower.includes('region') ||
      colIdLower.includes('khu vực') ||
      headerLower.includes('khu vực')
    ) {
      val = original.region;
    } else if (
      colIdLower.includes('create') ||
      colIdLower.includes('tạo') ||
      headerLower.includes('tạo')
    ) {
      val = original.createdAt;
    } else if (
      colIdLower.includes('update') ||
      colIdLower.includes('cập nhật') ||
      headerLower.includes('cập nhật')
    ) {
      val = original.updatedAt;
    }
  }

  if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const obj = val as Record<string, any>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.title === 'string') return obj.title;
    if (typeof obj.label === 'string') return obj.label;
    if (typeof obj.value === 'string' || typeof obj.value === 'number')
      return obj.value;
    if (Array.isArray(val)) return val.length;
    return '';
  }

  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }

  return val !== undefined && val !== null ? val : '';
}

export async function exportTableToExcel<TData>(
  table: TanstackTable<TData>,
  options: ExportTableToExcelOptions<TData> = {}
): Promise<void> {
  const {
    filename = `export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheetName = 'Data',
    excludeColumnIds = ['select', 'drag', 'actions', 'action', 'reorder'],
    onlySelectedRows = false,
    exportAllPages = true,
    customData,
    columnWidths: manualWidths,
    headerBackground = '#F1F5F9',
  } = options;

  const visibleColumns = table.getVisibleFlatColumns().filter((col) => {
    if (!col.id || excludeColumnIds.includes(col.id.toLowerCase())) {
      return false;
    }
    if (typeof col.columnDef.header === 'function' && !col.id) {
      return false;
    }
    return true;
  });

  if (visibleColumns.length === 0) {
    throw new Error('No visible columns available to export');
  }

  let rowsToExport: Record<string, unknown>[] = [];

  if (customData && customData.length > 0) {
    rowsToExport = customData.map((item) => item as Record<string, unknown>);
  } else {
    const selectedRows = table.getSelectedRowModel().rows;
    const isExportingSelected = onlySelectedRows && selectedRows.length > 0;

    let sourceRows = isExportingSelected
      ? selectedRows
      : exportAllPages
      ? table.getFilteredRowModel().rows
      : table.getRowModel().rows;

    if (
      sourceRows.length === 0 &&
      table.getCoreRowModel().rows.length > 0 &&
      !isExportingSelected
    ) {
      sourceRows = table.getCoreRowModel().rows;
    }

    if (sourceRows.length === 0) {
      toast.warning('Không có dữ liệu để xuất Excel');
      return;
    }

    rowsToExport = sourceRows.map((row) => {
      const rowObj: Record<string, unknown> = {};
      visibleColumns.forEach((col) => {
        rowObj[col.id] = extractCellValue(row, col);
      });
      return rowObj;
    });
  }

  const columnMappings: ColumnMapping[] = [];
  const calculatedWidths: Record<string, number> = {};

  visibleColumns.forEach((col, index) => {
    const colLetter = colNumToLetter(index + 1);
    const key = col.id;

    let headerText = formatColumnTitle(key);
    if (typeof col.columnDef.header === 'string') {
      headerText = col.columnDef.header;
    }

    let inferredType = EType.TEXT;
    for (const row of rowsToExport) {
      const val = row[key];
      if (val !== undefined && val !== null && val !== '') {
        inferredType = inferCellType(val);
        break;
      }
    }

    columnMappings.push({
      column: colLetter,
      key,
      header: headerText,
      type: inferredType,
    });

    const maxContentLen = Math.max(
      headerText.length,
      ...rowsToExport.slice(0, 50).map((r) => String(r[key] ?? '').length)
    );
    calculatedWidths[colLetter] = Math.min(Math.max(maxContentLen + 4, 12), 40);
  });

  const finalColumnWidths = { ...calculatedWidths, ...manualWidths };

  // 4. Styles: Style header row (Row 1)
  const lastColLetter = colNumToLetter(visibleColumns.length);
  const styles: CellStyle[] = [
    {
      address: { from: 'A1', to: `${lastColLetter}1` },
      font: { bold: true, size: 11 },
      background: headerBackground,
      border: 'thin',
      alignment: 'center',
    },
  ];

  // 5. Send POST to /api/excel
  const payload = {
    data: {
      rows: rowsToExport,
    },
    schema: {
      sheetName,
      table: {
        startRow: 2,
        headerRow: 1,
        columns: columnMappings,
      },
    },
    options: {
      filename,
      styles,
      columnWidths: finalColumnWidths,
    },
  };

  const response = await fetch('/api/excel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.message || `Failed to export Excel (${response.status})`);
  }

  // 6. Download file in browser
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
