import type { ApiErrorResponse, ValidationErrors } from '@/lib/api/apiTypes';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: ApiErrorResponse;
  readonly validationErrors: ValidationErrors;
  readonly requestId?: string;

  constructor(status: number, message: string, payload?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error_code;
    this.payload = payload;
    this.validationErrors = payload?.errors ?? {};
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
