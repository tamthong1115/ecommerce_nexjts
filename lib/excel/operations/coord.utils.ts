
/**
 * Utility to convert an Excel cell address (e.g., "A1", "C15") into 1-based row and column numbers.
 */
export function addressToRowCol(address: string): { row: number; col: number } {
    const match = address.match(/^([A-Z]+)([0-9]+)$/i);
    if (!match) throw new Error(`Invalid cell address: ${address}`);

    const colStr = match[1].toUpperCase();
    const row = parseInt(match[2], 10);

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    return { row, col };

}

/**
 * Utility to convert a 1-based column number into an Excel column letter (e.g., 1 -> "A", 28 -> "AB").
 */
export function colNumToLetter(col: number): string {
    let temp: number = col;
    let letter: string = "";

    while (temp > 0) {
        const modulo: number = (temp - 1) % 26;
        letter = String.fromCharCode(65 + modulo) + letter;
        temp = Math.floor((temp - 1) / 26);
    }
    return letter;
}

/**
 * Utility to convert 1-based row and column numbers into an Excel cell address (e.g., row=15, col=3 -> "C15").
 */
export function rowColToAddress(row: number, col: number): string {
  return `${colNumToLetter(col)}${row}`;
}