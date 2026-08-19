// hooks/use-excel.ts
import { useState } from 'react';
import { getExcelAdapter, downloadBlob } from '@/lib/excel';
import type { TemplateSchema, ExportOptions, ImportOptions } from '@/lib/excel/types';

export function useExcel() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const exportExcel = async (
    data: Record<string, unknown>,
    schema: TemplateSchema,
    options?: ExportOptions,
    templateBlob?: Blob
  ) => {
    setLoading(true);
    setErrors([]);
    try {
      const adapter = getExcelAdapter();
      const blob = await adapter.export(data, schema, options, templateBlob);
      if (options?.filename) {
        downloadBlob(blob, options.filename);
      }
      return blob;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to export Excel file';
      setErrors([errMsg]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importExcel = async <T = Record<string, unknown>>(
    file: File | Blob,
    schema: TemplateSchema,
    options?: ImportOptions
  ) => {
    setLoading(true);
    setErrors([]);
    try {
      const adapter = getExcelAdapter();
      const result = await adapter.import<T>(file, schema, options);
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      return result;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to import Excel file';
      setErrors([errMsg]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    exportExcel,
    importExcel,
    loading,
    errors,
  };
}
