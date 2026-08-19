export enum EType {
    TEXT = "text",
    NUMBER = "number",
    DATE = "date",
    BOOLEAN = "boolean",
    FORMULA = "formula"
}

export interface CellMapping {
    cell: string;
    key: string;
    type?: EType;
}

export interface ColumnMapping {
    column: string;
    key: string;
    type?: EType;
    required?: boolean
}

export interface TableMapping {
    startRow: number;                      // 1-based index where data rows begin
    headerRow?: number;                    // Row above startRow containing text headers
    endRow?: number;                       // Fixed end row (reads until empty row if omitted)
    stopOnEmptyRow?: boolean               // Stop reading when an empty row is encountered
    columns: ColumnMapping[];
}

export interface TemplateSchema {
    sheetName?: string | number           // name or 0-based index
    cells?: CellMapping[]                 // static fields (header area)
    table?: TableMapping                  // tabular data
}

export interface CellAddress {
    from:string;
    to?: string
}

export interface FontStyle {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;                        // Hex format, e.g., "#FF0000"
}

export interface CellStyle {
    address: CellAddress;
    font?: FontStyle;
    background?: string;                   // Hex format, e.g., "#F2F2F2"
    border?: 'thin' | 'dotted' | 'medium' | 'thick';
    alignment?: 'left' | 'center' | 'right';
    format?: string;                       // Excel format mask, e.g., "dd/MM/yyyy", "#,##0.00"
    merge?: boolean;                       // Merges range from -> to if true
}

export interface SheetOperation {
    type: 'clone' | 'delete' | 'rename';
    source: string | number;               // Source sheet name or index
    target?: string;                       // Target sheet name for clone or rename
}

export interface ExportOptions {
    filename?: string;
    styles?: CellStyle[];
    sheetOps?: SheetOperation[];
    columnWidths?: Record<string, number>;
}

export interface ImportOptions {
    transform?: (row: Record<string, unknown>) => Record<string, unknown>;
    validate?: (row: Record<string, unknown>) => string | null; // Returns error message or null
}

export interface ExcelAdapter {
    export(
        data: Record<string, unknown>,
        schema: TemplateSchema,
        options?: ExportOptions,
        templateBlob?: Blob
    ): Promise<Blob>;
    import<T = Record<string, unknown>>(
        blob: Blob,
        schema: TemplateSchema,
        options?: ImportOptions
    ): Promise<{ rows: T[]; errors: string[] }>;
}