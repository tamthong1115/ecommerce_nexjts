// lib/excel/index.ts
import { ExcelJSAdapter } from './adapters/exceljs.adapter';
import type { ExcelAdapter } from './types';

export * from './types';

/**
 * Excel Adapter Factory. Returns the configured ExcelAdapter.
 * Allows switching implementations (e.g. to SheetJS) without affecting client code.
 */
export function getExcelAdapter(): ExcelAdapter {
  return new ExcelJSAdapter();
}

/**
 * Utility to download a Blob object as a file in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
