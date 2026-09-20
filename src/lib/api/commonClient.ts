import { apiRequest } from '@/lib/api/httpClient';
import type { ApiRequestOptions } from '@/lib/api/apiTypes';

export const commonClient = {
  get: <TData>(path: string, options?: ApiRequestOptions) => apiRequest<TData>(path, { ...options, method: 'GET', guard: 'common' })
};
