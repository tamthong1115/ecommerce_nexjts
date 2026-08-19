import crypto from 'crypto';
import { env } from '@/lib/env';
const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) throw new Error('Missing SETTINGS_ENCRYPTION_KEY');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32)
    throw new Error('SETTINGS_ENCRYPTION_KEY must be 32 bytes (base64)');
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const cipherText = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    cipherText.toString('base64'),
  ].join('.');
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !ctB64)
    throw new Error('Invalid encrypted secret format');

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString('utf8');
}
