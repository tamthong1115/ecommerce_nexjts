// lib/excel/operations/sheet.ops.ts
import type { Workbook, Worksheet } from 'exceljs';
import type { SheetOperation } from '../types';

export function applySheetOps(wb: Workbook, ops: SheetOperation[]): string[] {
  const errors: string[] = [];

  for (const op of ops) {
    const sourceSheet = typeof op.source === 'number'
      ? wb.worksheets[op.source]
      : wb.getWorksheet(op.source);

    if (!sourceSheet) {
      errors.push(`Source sheet not found: ${op.source}`);
      continue;
    }

    switch (op.type) {
      case 'rename': {
        if (op.target) {
          sourceSheet.name = op.target;
        }
        break;
      }

      case 'clone': {
        if (!op.target) {
          errors.push(`Target sheet name not provided for clone operation on source: ${op.source}`);
          break;
        }
        const existingSheet = wb.getWorksheet(op.target);
        if (existingSheet) {
          errors.push(`Cannot clone to sheet "${op.target}": a sheet with this name already exists.`);
          break;
        }
        try {
          const targetSheet = wb.addWorksheet(op.target);
          cloneWorksheet(sourceSheet, targetSheet);
        } catch (err: any) {
          errors.push(`Failed to clone sheet to "${op.target}": ${err.message}`);
        }
        break;
      }

      case 'delete': {
        try {
          wb.removeWorksheet(sourceSheet.id);
        } catch (err: any) {
          errors.push(`Failed to delete sheet "${op.source}": ${err.message}`);
        }
        break;
      }
    }
  }

  return errors;
}

function cloneWorksheet(source: Worksheet, target: Worksheet): void {
  target.properties = { ...source.properties };
  target.pageSetup = { ...source.pageSetup };
  target.views = [ ...source.views ];

  // Copy column widths and styles
  source.columns?.forEach((col, idx) => {
    if (col && target.columns) {
      const targetCol = target.getColumn(idx + 1);
      targetCol.width = col.width;
      if (col.style) {
        targetCol.style = { ...col.style };
      }
    }
  });

  // Copy rows and cells
  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = target.getRow(rowNumber);
    newRow.height = row.height;
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      newCell.value = cell.value;
      if (cell.style) {
        newCell.style = { ...cell.style };
      }
    });
  });

  const merges = (source.model as any).merges || [];
  merges.forEach((mergeRange: string) => {
    target.mergeCells(mergeRange);
  });
}
