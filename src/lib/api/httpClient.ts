import { env } from '@/config/env';
import { ApiError } from '@/lib/api/apiError';
import type {
  ApiGuard,
  ApiErrorResponse,
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
const sensitiveKeys = new Set([
  'access_token',
  'authorization',
  'challenge_token',
  'current_password',
  'discovery_token',
  'password',
  'password_confirmation',
  'refresh_token',
  'reset_token',
  'token'
]);

function baseUrlForGuard(guard: ApiGuard) {
  if (guard === 'auth') return env.authApiBaseUrl;
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
  const session = options.guard === 'tenant' ? auth.tenant : auth.platform;
  const token = session.accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!(body instanceof FormData) && body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Request-Id', createRequestId());
  headers.set('X-Client-Version', env.clientVersion);

  if (options.guard !== 'auth' && token) headers.set('Authorization', `Bearer ${token}`);
  if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);
  if (options.timezone ?? session.timezone) headers.set('X-Timezone', options.timezone ?? session.timezone);
  if (options.locale ?? session.locale) headers.set('X-Locale', options.locale ?? session.locale);

  if (options.guard === 'platform' && options.impersonationReason) {
    headers.set('X-Impersonation-Reason', options.impersonationReason);
  }

  if (options.guard === 'tenant') {
    if (options.tenant) headers.set('X-Tenant', options.tenant);
    if (options.office ?? auth.tenant.office) headers.set('X-Office', options.office ?? auth.tenant.office ?? '');
  }

  return headers;
}

function normalizeBody(body: unknown) {
  if (body === undefined || body instanceof FormData || typeof body === 'string') {
    return body as BodyInit | undefined;
  }

  return JSON.stringify(body);
}

function maskValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskValue);
  if (!value || typeof value !== 'object') return value;

  if (value instanceof FormData) return '[FormData]';

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? '[redacted]' : maskValue(entry)
    ])
  );
}

function logApiEvent(
  level: 'debug' | 'error',
  message: string,
  details: Record<string, unknown>
) {
  if (!env.enableApiLogs) return;

  const logger = level === 'error' ? console.error : console.debug;
  logger(`[api] ${message}`, details);
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
  const headers = normalizeHeaders(options, body);
  const requestId = headers.get('X-Request-Id') ?? undefined;
  const startedAt = performance.now();

  logApiEvent('debug', 'request', {
    guard,
    method: options.method,
    url,
    requestId,
    tenant,
    body: maskValue(body)
  });

  const response = await fetch(url, {
    ...init,
    method: options.method,
    body: normalizedBody,
    headers
  });

  if (response.status === 204) {
    logApiEvent('debug', 'response', {
      guard,
      method: options.method,
      url,
      requestId,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt)
    });
    return { data: undefined as TData };
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    const errorPayload: ApiErrorResponse =
      payload && typeof payload === 'object'
        ? {
            message:
              (payload as { message?: string }).message ?? 'Request failed.',
            error_code:
              (payload as { error_code?: string }).error_code ??
              ((payload as { errors?: { code?: string } }).errors?.code),
            errors:
              (payload as { errors?: Record<string, string[]> }).errors ??
              ((payload as { errors?: { details?: Record<string, string[]> } }).errors?.details),
            request_id:
              (payload as { request_id?: string }).request_id ??
              ((payload as { meta?: { request_id?: string } }).meta?.request_id)
          }
        : { message: String(payload) };
    const error = new ApiError(response.status, errorPayload.message ?? 'Request failed.', errorPayload);
    logApiEvent('error', 'error', {
      guard,
      method: options.method,
      url,
      requestId: error.requestId ?? requestId,
      status: response.status,
      code: error.code,
      message: error.message,
      durationMs: Math.round(performance.now() - startedAt),
      validationErrors: maskValue(error.validationErrors)
    });
    if (error.status === 401 && options.guard !== 'auth') {
      authStore.clear(options.guard);
    }
    throw error;
  }

  const normalized = normalizeEnvelope<TData>(payload);
  logApiEvent('debug', 'response', {
    guard,
    method: options.method,
    url,
    requestId,
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
    data: maskValue(normalized.data)
  });

  return normalized;
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

      logApiEvent('debug', 'retry', {
        guard: options.guard,
        method: options.method,
        url,
        attempt: attempt + 1
      });
      await sleep(retryDelay(attempt));
      attempt += 1;
    }
  }
}
