import { Prisma, PrismaClient } from '@/lib/generated/prisma';

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  GATEWAY_TIMEOUT: 504,
} as const;

export type StatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

/**
 * Standard API envelope for backend responses.
 *
 * @template T  Data payload type (defaults to null).
 * @template ME Additional meta fields type (defaults to unknown). Useful for extra counters/flags.
 *
 * @property {boolean} success Whether the request succeeded.
 * @property {string} message Human-readable status or summary.
 * @property {StatusCode} code HTTP-like status code.
 * @property {T} [data] Optional response payload.
 * @property {{
 *   pagination?: PaginationMeta;
 *   cursor?: CursorMeta;
 * } & (ME extends Record<string, any> ? ME : unknown)} [meta]
 * Optional metadata: pagination, cursor info, plus any extra meta fields.
 * @property {Record<string, string[] | undefined> | null | object} [errors]
 * Optional validation or server error details.
 */ export interface ApiResponse<T = null, ME = unknown> {
  success: boolean;
  message: string;
  code: StatusCode;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    cursor?: CursorMeta;
  } & (ME extends Record<string, any> ? ME : unknown);
  errors?: Record<string, string[] | undefined> | null | object;
}
export type DbClient = Prisma.TransactionClient | PrismaClient;
