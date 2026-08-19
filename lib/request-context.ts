import { AsyncLocalStorage } from 'async_hooks';

export type RequestTraceContext = {
  userId?: string;
  ip?: string;
  userAgent?: string;
  actionSource?: 'API' | 'SYSTEM' | 'JOB';
};

const traceContext = new AsyncLocalStorage<RequestTraceContext>();

/**
 * Returns the current request context if one has been set.
 */
export function getTraceContext() {
  return traceContext.getStore();
}

/**
 * Executes a callback within a new trace context.
 */
export function runWithTraceContext<R>(
  context: RequestTraceContext,
  callback: () => R
): R {
  return traceContext.run(context, callback);
}
