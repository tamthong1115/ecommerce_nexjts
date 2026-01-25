import {
  PrismaForeignKeyConstraintError,
  PrismaOperationFailedError,
  PrismaRecordDoesNotExistError,
  PrismaUniqueConstraintError,
  toTypedPrismaError,
} from '@/lib/prisma-errors';
import { ServiceError } from './service-error';
import { ApiResponse, HttpStatus, StatusCode } from '@/types/api';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

interface SuccessOptions<T> {
  data?: T;
  message?: string;
  code?: StatusCode;
  meta?: ApiResponse<T>['meta'];
}

interface PaginatedOptions<T> {
  data?: T;
  page: number;
  limit: number;
  total: number;
  message?: string;
  code?: StatusCode;
}

interface CursorPaginatedOptions<T> {
  data?: T;
  nextCursor: string | null | undefined;
  message?: string;
  code?: StatusCode;
  meta?: Record<string, any>;
}

interface ErrorOptions {
  message?: string;
  code?: StatusCode;
  errors?: Record<string, string[] | undefined> | null | object;
}

export class ResponseFactory {
  static success<T = null>({
    data,
    message = 'success',
    code = HttpStatus.OK,
    meta,
  }: SuccessOptions<T>): ApiResponse<T> {
    return {
      success: true,
      message,
      code,
      data,
      meta,
    };
  }

  static paginated<T = null>({
    data,
    page,
    limit,
    total,
    message = 'success',
    code = HttpStatus.OK,
  }: PaginatedOptions<T>): ApiResponse<T> {
    const totalPages = Math.ceil(total / (limit || 1));

    return ResponseFactory.success({
      data,
      message,
      code,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  }

  static cursorPaginated<T = null>({
    data,
    nextCursor,
    message = 'success',
    code = HttpStatus.OK,
    meta = {},
  }: CursorPaginatedOptions<T>): ApiResponse<T> {
    return ResponseFactory.success({
      data,
      message,
      code,
      meta: {
        ...meta,
        cursor: {
          nextCursor: nextCursor || null,
          hasNextPage: !!nextCursor,
        },
      },
    });
  }

  static error({
    message = 'error',
    code = HttpStatus.BAD_REQUEST,
    errors,
  }: ErrorOptions = {}): ApiResponse<never> {
    return {
      success: false,
      message,
      code,
      errors,
    };
  }

  static handleError(error: unknown): ApiResponse<never> {
    console.error('Operation failed:', error);

    if (error instanceof ServiceError) {
      return ResponseFactory.error({
        message: error.message,
        code: error.statusCode,
        errors: error.errors,
      });
    }

    if (error instanceof ZodError) {
      return ResponseFactory.error({
        message: 'Validation Error',
        code: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: error.flatten().fieldErrors,
      });
    }

    const prismaError = toTypedPrismaError(error);

    if (prismaError) {
      if (prismaError instanceof PrismaUniqueConstraintError) {
        const target =
          (prismaError.meta as { target?: string[] })?.target?.join(', ') ||
          'field';
        return ResponseFactory.error({
          message: `Value for ${target} already exists.`,
          code: HttpStatus.CONFLICT,
        });
      }

      if (
        prismaError instanceof PrismaOperationFailedError ||
        prismaError instanceof PrismaRecordDoesNotExistError
      ) {
        return ResponseFactory.error({
          message: 'Requested record not found.',
          code: HttpStatus.NOT_FOUND,
        });
      }

      if (prismaError instanceof PrismaForeignKeyConstraintError) {
        const field =
          (prismaError.meta as { field_name?: string })?.field_name ||
          'reference';
        return ResponseFactory.error({
          message: `Invalid reference: ${field} does not exist.`,
          code: HttpStatus.BAD_REQUEST,
        });
      }

      if (prismaError.code === 'P2000') {
        return ResponseFactory.error({
          message: 'Input value is too long.',
          code: HttpStatus.BAD_REQUEST,
        });
      }

      if (prismaError.code === 'P1008') {
        return ResponseFactory.error({
          message: 'Database operation timed out.',
          code: HttpStatus.GATEWAY_TIMEOUT,
        });
      }
    }

    // Default to 500
    return ResponseFactory.error({
      message: 'Internal Server Error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }

  static toNextResponse<T>(response: ApiResponse<T>) {
    return NextResponse.json(response, { status: response.code });
  }
}
