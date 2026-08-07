import { apiRequest } from '@/lib/api/httpClient';

export function createTenantClient(tenant: string) {
  return {
    get: <TResponse>(path: string, init?: RequestInit) =>
      apiRequest<TResponse>(path, { ...init, method: 'GET', guard: 'tenant', tenant }),
    post: <TResponse, TBody = unknown>(path: string, body?: TBody, init?: RequestInit) =>
      apiRequest<TResponse>(path, {
        ...init,
        method: 'POST',
        guard: 'tenant',
        tenant,
        body: body instanceof FormData ? body : JSON.stringify(body ?? {})
      }),
    patch: <TResponse, TBody = unknown>(path: string, body?: TBody, init?: RequestInit) =>
      apiRequest<TResponse>(path, {
        ...init,
        method: 'PATCH',
        guard: 'tenant',
        tenant,
        body: JSON.stringify(body ?? {})
      }),
    delete: <TResponse>(path: string, init?: RequestInit) =>
      apiRequest<TResponse>(path, { ...init, method: 'DELETE', guard: 'tenant', tenant })
  };
}
