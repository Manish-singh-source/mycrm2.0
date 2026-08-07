import { apiRequest } from '@/lib/api/httpClient';
import type { ApiRequestOptions } from '@/lib/api/apiTypes';

export const platformClient = {
  get: <TData>(path: string, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, { ...options, method: 'GET', guard: 'platform' }),
  post: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, {
      ...options,
      method: 'POST',
      guard: 'platform',
      body
    }),
  put: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, {
      ...options,
      method: 'PUT',
      guard: 'platform',
      body
    }),
  patch: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, {
      ...options,
      method: 'PATCH',
      guard: 'platform',
      body
    }),
  delete: <TData>(path: string, options?: ApiRequestOptions) =>
    apiRequest<TData>(path, { ...options, method: 'DELETE', guard: 'platform' })
};
