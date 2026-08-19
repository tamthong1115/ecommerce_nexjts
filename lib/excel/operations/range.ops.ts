// lib/excel/operations/range.ops.ts
import type { Cell, Worksheet } from 'exceljs';
import { EType } from '../types';
import type { CellMapping, TableMapping } from '../types';
import { addressToRowCol } from './coord.utils';

export function writeCells(
  ws: Worksheet,
  data: Record<string, unknown>,
  cells: CellMapping[]
): void {
  for (const { cell: cellAddr, key, type } of cells) {
    const value = data[key];
    if (value === undefined || value === null) continue;

    const cell = ws.getCell(cellAddr);
    writeCellValue(cell, value, type);
  }
}

export function writeTable(
  ws: Worksheet,
  rows: Record<string, unknown>[],
  table: TableMapping,
  columnWidths?: Record<string, number>
): void {
  // Precompute column coordinates to avoid redundant resolution in loops
  const resolvedColumns = table.columns.map(col => {
    const { col: colIdx } = addressToRowCol(`${col.column}1`);
    return {
      key: col.key,
      colIdx,
      type: col.type,
    };
  });

  // Write header row if provided
  if (table.headerRow) {
    for (const col of resolvedColumns) {
      const cell = ws.getCell(table.headerRow, col.colIdx);
      cell.value = col.key;
    }
  }

  // Write data rows
  rows.forEach((row, i) => {
    const rowIdx = table.startRow + i;
    for (const col of resolvedColumns) {
      const cell = ws.getCell(rowIdx, col.colIdx);
      writeCellValue(cell, row[col.key], col.type);
    }
  });

  // Set column widths if provided
  if (columnWidths) {
    Object.entries(columnWidths).forEach(([colLetter, width]) => {
      const { col: colIdx } = addressToRowCol(`${colLetter}1`);
      const col = ws.getColumn(colIdx);
      col.width = width;
    });
  }
}

export function readCells(
  ws: Worksheet,
  cells: CellMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { cell: cellAddr, key, type } of cells) {
    const cell = ws.getCell(cellAddr);
    result[key] = coerceValue(cell.value, type);
  }
  return result;
}

export function readTable(
  ws: Worksheet,
  table: TableMapping
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  
  // Precompute column coordinates to avoid redundant resolution in loops
  const resolvedColumns = table.columns.map(col => {
    const { col: colIdx } = addressToRowCol(`${col.column}1`);
    return {
      key: col.key,
      colIdx,
      type: col.type,
    };
  });

  const endRow = table.endRow ?? ws.actualRowCount;
  const stopOnEmptyRow = table.stopOnEmptyRow ?? true;
  
  for (let r = table.startRow; r <= endRow; r++) {
    const row: Record<string, unknown> = {};
    let hasData = false;

    for (const col of resolvedColumns) {
      const cell = ws.getCell(r, col.colIdx);
      const val = coerceValue(cell.value, col.type);
      
      if (val !== null && val !== undefined && val !== '') {
        hasData = true;
      }
      row[col.key] = val;
    }

    if (!hasData && stopOnEmptyRow) break;
    rows.push(row);
  }

  return rows;
}

function writeCellValue(cell: Cell, value: unknown, type?: EType): void {
  if (type === EType.FORMULA) {
    cell.value = { formula: String(value) };
    return;
  }
  
  if (value instanceof Date || type === EType.DATE) {
    cell.value = value instanceof Date ? value : new Date(String(value));
    return;
  }
  
  if (type === EType.NUMBER || typeof value === 'number') {
    cell.value = Number(value);
    return;
  }
  
  if (type === EType.BOOLEAN || typeof value === 'boolean') {
    cell.value = Boolean(value);
    return;
  }
  
  cell.value = String(value ?? '');
}

function coerceValue(value: unknown, type?: EType): unknown {
  if (value === undefined || value === null) return null;

  if (typeof value === 'object' && value !== null) {
    // Handle ExcelJS rich text formatting cell values to avoid concatenating to "[object Object]"
    if ('richText' in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((run: any) => run.text || '').join('');
    }
    if ('formula' in value) {
      return (value as any).result ?? (value as any).formula;
    }
    if ('hyperlink' in value) {
      return (value as any).text ?? (value as any).hyperlink;
    }
  }

  switch (type) {
    case EType.NUMBER:
      return Number(value);
    case EType.BOOLEAN:
      return Boolean(value);
    case EType.DATE:
      return value instanceof Date ? value : new Date(String(value));
    default:
      return String(value);
  }
}
