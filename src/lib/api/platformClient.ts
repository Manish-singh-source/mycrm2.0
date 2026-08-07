import { apiRequest } from '@/lib/api/httpClient';

export const platformClient = {
  get: <TResponse>(path: string, init?: RequestInit) =>
    apiRequest<TResponse>(path, { ...init, method: 'GET', guard: 'platform' }),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody, init?: RequestInit) =>
    apiRequest<TResponse>(path, {
      ...init,
      method: 'POST',
      guard: 'platform',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {})
    }),
  patch: <TResponse, TBody = unknown>(path: string, body?: TBody, init?: RequestInit) =>
    apiRequest<TResponse>(path, {
      ...init,
      method: 'PATCH',
      guard: 'platform',
      body: JSON.stringify(body ?? {})
    }),
  delete: <TResponse>(path: string, init?: RequestInit) =>
    apiRequest<TResponse>(path, { ...init, method: 'DELETE', guard: 'platform' })
};
