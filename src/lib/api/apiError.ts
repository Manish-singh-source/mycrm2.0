import type { ApiErrorResponse } from '@/lib/api/apiTypes';

export class ApiError extends Error {
  readonly status: number;
  readonly payload?: ApiErrorResponse;

  constructor(status: number, message: string, payload?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
