import { apiRequest } from '@/lib/api/httpClient';

export const commonClient = {
  get: <TData>(path: string) => apiRequest<TData>(path, { method: 'GET', guard: 'common' })
};
