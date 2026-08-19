import type { Cell, Worksheet, Border } from 'exceljs';
import { CellStyle } from "../types";
import { addressToRowCol } from './coord.utils';

export function hexToArgb(hex: string): string {
    let cleanHex = hex.replace('#', '').toUpperCase()

    // If the hex is 3 digits, expand it to 6
    // e.g. F00 -> FF0000
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map((c) => c + c).join('')
    }

    if (cleanHex.length === 6) {
        return `FF${cleanHex}`;
    }

    return cleanHex;

}

export function applyStyles(ws: Worksheet, styles: CellStyle[]): void {
    for (const style of styles) {
        const { from, to } = style.address;
        if (to) {
            const start = addressToRowCol(from);
            const end = addressToRowCol(to);
            const startRow = Math.min(start.row, end.row);
            const endRow = Math.max(start.row, end.row);
            const startCol = Math.min(start.col, end.col);
            const endCol = Math.max(start.col, end.col);
            if (style.merge) {
                ws.mergeCells(startRow, startCol, endRow, endCol);
            }
            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    const cell = ws.getCell(r, c);
                    applyStyleToCell(cell, style);
                }
            }
        } else {
            const cell = ws.getCell(from);
            applyStyleToCell(cell, style);
        }
    }
}

function applyStyleToCell(cell: Cell, style: CellStyle): void {
    if (style.font) {
        cell.font = {
            bold: style.font.bold,
            italic: style.font.italic,
            size: style.font.size,
            color: style.font.color ? { argb: hexToArgb(style.font.color) } : undefined,
        };
    }
    if (style.background) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToArgb(style.background) },
        };
    }
    if (style.border) {
        const borderStyle: Partial<Border> = { style: style.border };
        cell.border = {
            top: borderStyle,
            bottom: borderStyle,
            left: borderStyle,
            right: borderStyle,
        };
    }
    if (style.alignment) {
        cell.alignment = {
            horizontal: style.alignment === 'center' ? 'center' : style.alignment === 'right' ? 'right' : 'left',
            vertical: 'middle',
        };
    }
    if (style.format) {
        cell.numFmt = style.format;
    }
}