// lib/excel/adapters/exceljs.adapter.ts
import ExcelJS from 'exceljs';
import type { ExcelAdapter, TemplateSchema, ExportOptions, ImportOptions } from '../types';
import { applyStyles } from '../operations/style.ops';
import { applySheetOps } from '../operations/sheet.ops';
import { writeCells, writeTable, readCells, readTable } from '../operations/range.ops';

export class ExcelJSAdapter implements ExcelAdapter {
  async export(
    data: Record<string, unknown>,
    schema: TemplateSchema,
    options?: ExportOptions,
    templateBlob?: Blob
  ): Promise<Blob> {
    const wb = new ExcelJS.Workbook();

    if (templateBlob) {
      const buffer = await templateBlob.arrayBuffer();
      await wb.xlsx.load(buffer);
    } else {
      wb.addWorksheet(schema.sheetName ? String(schema.sheetName) : 'Sheet1');
    }

    const ws = typeof schema.sheetName === 'number'
      ? wb.worksheets[schema.sheetName]
      : wb.getWorksheet(schema.sheetName ? String(schema.sheetName) : 'Sheet1') || wb.worksheets[0];

    if (!ws) {
      throw new Error(`Target worksheet not found: ${schema.sheetName}`);
    }

    if (schema.cells && data) {
      writeCells(ws, data, schema.cells);
    }

    if (schema.table && data) {
      const tableData = data[schema.table.columns[0]?.key] || data.rows || data.items || [];
      if (Array.isArray(tableData)) {
        writeTable(ws, tableData as Record<string, unknown>[], schema.table, options?.columnWidths);
      }
    }

    if (options?.styles) {
      applyStyles(ws, options.styles);
    }

    if (options?.sheetOps) {
      const opsErrors = applySheetOps(wb, options.sheetOps);
      if (opsErrors.length > 0) {
        throw new Error(`Sheet operations failed: ${opsErrors.join('; ')}`);
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async import<T = Record<string, unknown>>(
    blob: Blob,
    schema: TemplateSchema,
    options?: ImportOptions
  ): Promise<{ rows: T[]; errors: string[] }> {
    const wb = new ExcelJS.Workbook();
    const buffer = await blob.arrayBuffer();
    await wb.xlsx.load(buffer);

    const ws = typeof schema.sheetName === 'number'
      ? wb.worksheets[schema.sheetName]
      : wb.getWorksheet(schema.sheetName ? String(schema.sheetName) : 'Sheet1') || wb.worksheets[0];

    if (!ws) {
      return { rows: [], errors: [`Source worksheet not found: ${schema.sheetName}`] };
    }

    const errors: string[] = [];
    let rows: T[] = [];
    const headerData = schema.cells ? readCells(ws, schema.cells) : {};

    if (schema.table) {
      const rawRows = readTable(ws, schema.table);
      
      const processedRows = rawRows.map((rawRow, index) => {
        let rowData = { ...headerData, ...rawRow };

        if (options?.transform) {
          rowData = options.transform(rowData);
        }

        if (options?.validate) {
          const err = options.validate(rowData);
          if (err) {
            errors.push(`Row ${schema.table!.startRow + index}: ${err}`);
          }
        }

        return rowData as unknown as T;
      });

      rows = processedRows;
    }

    return { rows, errors };
  }
}
