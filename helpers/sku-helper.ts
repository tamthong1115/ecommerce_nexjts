/**
 * Make a short random alphanumeric string
 */
export function randomSuffix(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Client-side SKU generator based on a name (title / variant name) or random.
 * Produces uppercase alphanumeric SKUs safe to use immediately on the client.
 */
export function generateClientSku(name?: string): string {
  const base = name
    ? name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/[^A-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 12)
    : 'SKU';
  return `${base}-${randomSuffix(4)}`;
}
