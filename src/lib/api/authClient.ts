import { apiRequest } from '@/lib/api/httpClient';
import type { ApiRequestOptions } from '@/lib/api/apiTypes';

export const authClient = {
  get: <TData>(path: string, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, { ...options, method: 'GET', guard: 'auth' }),
  post: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, {
      ...options,
      method: 'POST',
      guard: 'auth',
      body
    })
};
