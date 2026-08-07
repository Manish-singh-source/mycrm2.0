import { env } from '@/config/env';
import { ApiError } from '@/lib/api/apiError';
import type { ApiGuard } from '@/lib/api/apiTypes';
import { authStore } from '@/features/auth/store/authStore';

type RequestOptions = RequestInit & {
  guard: ApiGuard;
  tenant?: string;
};

function baseUrlForGuard(guard: ApiGuard) {
  return guard === 'platform' ? env.platformApiBaseUrl : env.tenantApiBaseUrl;
}

function createRequestId() {
  return crypto.randomUUID();
}

export async function apiRequest<TResponse>(path: string, options: RequestOptions): Promise<TResponse> {
  const { guard, tenant, headers, body, ...init } = options;
  const auth = authStore.getSnapshot();
  const token = guard === 'platform' ? auth.platform.accessToken : auth.tenant.accessToken;
  const url = `${baseUrlForGuard(guard)}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...init,
    body,
    headers: {
      Accept: 'application/json',
      'X-Request-Id': createRequestId(),
      'X-Client-Version': env.clientVersion,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(guard === 'tenant' && tenant ? { 'X-Tenant': tenant } : {}),
      ...headers
    }
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? 'Request failed.', payload);
  }

  return payload as TResponse;
}
