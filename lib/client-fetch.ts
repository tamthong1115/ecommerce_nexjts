import { ApiResponse } from '@/types/api';

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

export async function fetchApi<T, ME = unknown>(
  endpoint: string,
  { params, ...options }: FetchOptions = {}
): Promise<ApiResponse<T, ME>> {
  let finalEndpoint = endpoint;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    if (query) {
      finalEndpoint += `?${query}`;
    }
  }

  const res = await fetch(finalEndpoint, options);
  const payload = await res.json();

  return payload as ApiResponse<T, ME>;
}
