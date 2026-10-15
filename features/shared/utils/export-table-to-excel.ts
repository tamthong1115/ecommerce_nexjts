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

  // 1. Filter exportable visible columns
  const visibleColumns = table.getVisibleFlatColumns().filter((col) => {
    if (!col.id || excludeColumnIds.includes(col.id.toLowerCase())) {
      return false;
    }
    // Exclude special UI columns without accessors or headers
    if (typeof col.columnDef.header === 'function' && !col.id) {
      return false;
    }
    return true;
  });

  if (visibleColumns.length === 0) {
    throw new Error('No visible columns available to export');
  }

  // 2. Resolve rows data
  let rowsToExport: Record<string, unknown>[] = [];

  if (customData && customData.length > 0) {
    rowsToExport = customData.map((item) => item as Record<string, unknown>);
  } else {
    const selectedRows = table.getSelectedRowModel().rows;
    const isExportingSelected = onlySelectedRows && selectedRows.length > 0;
    
    // Choose selected rows, all filtered rows, or current page rows
    const sourceRows = isExportingSelected
      ? selectedRows
      : exportAllPages
      ? table.getFilteredRowModel().rows
      : table.getRowModel().rows;

    rowsToExport = sourceRows.map((row) => {
      const rowObj: Record<string, unknown> = {};
      visibleColumns.forEach((col) => {
        let val: unknown = undefined;
        try {
          val = row.getValue(col.id);
        } catch {
          val = (row.original as any)?.[col.id];
        }
        rowObj[col.id] = val !== undefined ? val : '';
      });
      return rowObj;
    });
  }

  // 3. Build ColumnMapping with auto-letters (A, B, C...) and headers
  const columnMappings: ColumnMapping[] = [];
  const calculatedWidths: Record<string, number> = {};

  visibleColumns.forEach((col, index) => {
    const colLetter = colNumToLetter(index + 1);
    const key = col.id;

    // Resolve header label
    let headerText = formatColumnTitle(key);
    if (typeof col.columnDef.header === 'string') {
      headerText = col.columnDef.header;
    }

    // Infer type from sample rows
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

    // Approximate column width based on header length and content
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
