import { apiRequest } from '@/lib/api/httpClient';
import type { ApiRequestOptions } from '@/lib/api/apiTypes';

export function createTenantClient(tenant: string) {
  return {
    get: <TData>(path: string, options?: ApiRequestOptions) =>
      apiRequest<TData>(path, { ...options, method: 'GET', guard: 'tenant', tenant }),
    post: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
      apiRequest<TData>(path, {
        ...options,
        method: 'POST',
        guard: 'tenant',
        tenant,
        body
      }),
    put: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
      apiRequest<TData>(path, {
        ...options,
        method: 'PUT',
        guard: 'tenant',
        tenant,
        body
      }),
    patch: <TData, TBody = unknown>(path: string, body?: TBody, options?: ApiRequestOptions) =>
      apiRequest<TData>(path, {
        ...options,
        method: 'PATCH',
        guard: 'tenant',
        tenant,
        body
      }),
    delete: <TData>(path: string, options?: ApiRequestOptions) =>
      apiRequest<TData>(path, { ...options, method: 'DELETE', guard: 'tenant', tenant })
  };
}
