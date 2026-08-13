import type { ApiErrorResponse, ValidationErrors } from '@/lib/api/apiTypes';

function fieldLabel(field: string) {
  return field
    .replace(/\.\d+/g, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function messageList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(messageList);
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([field, messages]) =>
      messageList(messages).map((message) => `${fieldLabel(field)}: ${message}`)
    );
  }

  return value === undefined || value === null ? [] : [String(value)];
}

function normalizeValidationErrors(errors: unknown): ValidationErrors {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};

  const details = (errors as { details?: unknown }).details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return normalizeValidationErrors(details);
  }

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>)
      .filter(([field]) => field !== 'code')
      .map(([field, messages]) => [field, messageList(messages)])
      .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
  );
}

function validationSummary(errors: ValidationErrors) {
  return Object.entries(errors)
    .flatMap(([field, messages]) => messageList(messages).map((message) => `${fieldLabel(field)}: ${message}`))
    .join(' ');
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: ApiErrorResponse;
  readonly validationErrors: ValidationErrors;
  readonly requestId?: string;

  constructor(status: number, message: string, payload?: ApiErrorResponse) {
    const validationErrors = normalizeValidationErrors(payload?.errors);
    const details = validationSummary(validationErrors);

    super(details ? `${message}: ${details}` : message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error_code;
    this.payload = payload;
    this.validationErrors = validationErrors;
    this.requestId = payload?.request_id;
  }

  get isValidationError() {
    return this.status === 422 || Object.keys(this.validationErrors).length > 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}
