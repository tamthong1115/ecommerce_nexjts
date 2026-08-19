// app/api/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSeller } from '@/lib/require-admin';
import { ResponseFactory } from '@/lib/api-response';
import { HttpStatus } from '@/types/api';
import { getExcelAdapter } from '@/lib/excel';
import { EType } from '@/lib/excel/types';

// Route segment config (Next.js size documentation)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const cellMappingSchema = z.object({
  cell: z.string().min(2),
  key: z.string().min(1),
  type: z.nativeEnum(EType).optional(),
});

const columnMappingSchema = z.object({
  column: z.string().min(1),
  key: z.string().min(1),
  type: z.nativeEnum(EType).optional(),
  required: z.boolean().optional(),
});

const tableMappingSchema = z.object({
  startRow: z.number().int().positive(),
  headerRow: z.number().int().positive().optional(),
  endRow: z.number().int().positive().optional(),
  columns: z.array(columnMappingSchema),
  stopOnEmptyRow: z.boolean().optional(),
});

const templateSchemaZod = z.object({
  sheetName: z.union([z.string(), z.number()]).optional(),
  cells: z.array(cellMappingSchema).optional(),
  table: tableMappingSchema.optional(),
});

const cellAddressSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2).optional(),
});

const fontStyleSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  size: z.number().positive().optional(),
  color: z.string().optional(),
});

const cellStyleSchema = z.object({
  address: cellAddressSchema,
  font: fontStyleSchema.optional(),
  background: z.string().optional(),
  border: z.enum(['thin', 'dotted', 'medium', 'thick']).optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  format: z.string().optional(),
  merge: z.boolean().optional(),
});

const sheetOperationSchema = z.object({
  type: z.enum(['clone', 'delete', 'rename']),
  source: z.union([z.string(), z.number()]),
  target: z.string().optional(),
});

const exportOptionsSchema = z.object({
  filename: z.string().optional(),
  styles: z.array(cellStyleSchema).optional(),
  sheetOps: z.array(sheetOperationSchema).optional(),
  columnWidths: z.record(z.string(), z.number()).optional(),
});

const exportRequestSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  schema: templateSchemaZod,
  options: exportOptionsSchema.optional(),
});

/**
 * POST /api/excel
 * Secured endpoint for exporting Excel sheets. Requires seller or admin authentication.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication (Sellers & Admins only)
    const session = await requireSeller();
    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Unauthenticated',
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    // 2. Enforce Request Body Size Limit (10MB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 'Payload too large. Limit is 10MB.',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    // 3. Validate Request Payload using Zod
    const body = await req.json();
    const validated = exportRequestSchema.parse(body);
    const { data, schema, options } = validated;

    // 4. Generate the Excel binary blob
    const adapter = getExcelAdapter();
    const blob = await adapter.export(data, schema, options);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const filename = options?.filename || 'export.xlsx';

    // NOTE: For very large exports in the future, we may want to adopt exceljs's streaming writer
    // (ExcelJS.stream.xlsx.WorkbookWriter) instead of wb.xlsx.writeBuffer() to reduce memory usage.

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    // 5. Secure Error Logging and Response formatting
    const errorResponse = ResponseFactory.handleError(error);
    return ResponseFactory.toNextResponse(errorResponse);
  }
}
