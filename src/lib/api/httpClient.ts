import { env } from '@/config/env';
import { ApiError } from '@/lib/api/apiError';
import type {
  ApiGuard,
  ApiRequestOptions,
  HttpMethod,
  NormalizedApiResponse
} from '@/lib/api/apiTypes';
import { authStore } from '@/features/auth/store/authStore';
import { toQueryString } from '@/lib/api/queryString';

type RequestOptions = ApiRequestOptions & {
  guard: ApiGuard;
  method: HttpMethod;
  tenant?: string;
};

const readMethods = new Set<HttpMethod>(['GET']);
const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

function baseUrlForGuard(guard: ApiGuard) {
  return guard === 'platform' ? env.platformApiBaseUrl : env.tenantApiBaseUrl;
}

function createRequestId() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeHeaders(options: RequestOptions, body: unknown) {
  const auth = authStore.getSnapshot();
  const token = options.guard === 'platform' ? auth.platform.accessToken : auth.tenant.accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!(body instanceof FormData) && body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Request-Id', createRequestId());
  headers.set('X-Client-Version', env.clientVersion);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);
  if (options.timezone) headers.set('X-Timezone', options.timezone);
  if (options.locale) headers.set('X-Locale', options.locale);

  if (options.guard === 'platform' && options.impersonationReason) {
    headers.set('X-Impersonation-Reason', options.impersonationReason);
  }

  if (options.guard === 'tenant') {
    if (options.tenant) headers.set('X-Tenant', options.tenant);
    if (options.office) headers.set('X-Office', options.office);
  }

  return headers;
}

function normalizeBody(body: unknown) {
  if (body === undefined || body instanceof FormData || typeof body === 'string') {
    return body as BodyInit | undefined;
  }

  return JSON.stringify(body);
}

function normalizeEnvelope<TData>(payload: unknown): NormalizedApiResponse<TData> {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as NormalizedApiResponse<TData>;
    return {
      data: envelope.data,
      meta: envelope.meta,
      links: envelope.links
    };
  }

  return { data: payload as TData };
}

function shouldRetry(error: unknown) {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return false;
  }
  if (error instanceof ApiError) return retryableStatuses.has(error.status);
  return error instanceof TypeError;
}

function retryCountFor(options: RequestOptions) {
  if (!readMethods.has(options.method)) return 0;
  if (options.retry === false) return 0;
  if (typeof options.retry === 'number') return options.retry;
  return 2;
}

function retryDelay(attempt: number) {
  return Math.min(300 * 2 ** attempt, 1_500);
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => undefined);
  }

  return response.text().catch(() => undefined);
}

async function runRequest<TData>(url: string, options: RequestOptions) {
  const { guard, tenant, query, body, retry, idempotencyKey, timezone, locale, impersonationReason, office, ...init } =
    options;
  const normalizedBody = normalizeBody(body);
  const response = await fetch(url, {
    ...init,
    method: options.method,
    body: normalizedBody,
    headers: normalizeHeaders(options, body)
  });

  if (response.status === 204) {
    return { data: undefined as TData };
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === 'object'
        ? (payload as { message?: string; error_code?: string; errors?: Record<string, string[]>; request_id?: string })
        : { message: String(payload) };
    throw new ApiError(response.status, errorPayload.message ?? 'Request failed.', errorPayload);
  }

  return normalizeEnvelope<TData>(payload);
}

export async function apiRequest<TData>(
  path: string,
  options: RequestOptions
): Promise<NormalizedApiResponse<TData>> {
  const url = `${baseUrlForGuard(options.guard)}${path.startsWith('/') ? path : `/${path}`}${toQueryString(
    options.query
  )}`;
  const retries = retryCountFor(options);
  let attempt = 0;

  while (true) {
    try {
      return await runRequest<TData>(url, options);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error) || options.signal?.aborted) {
        throw error;
      }

      await sleep(retryDelay(attempt));
      attempt += 1;
    }
  }
}
