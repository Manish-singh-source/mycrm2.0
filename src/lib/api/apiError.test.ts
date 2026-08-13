import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/apiError';

describe('ApiError', () => {
  it('formats validation details without rendering objects as text', () => {
    const error = new ApiError(422, 'Validation failed.', {
      message: 'Validation failed.',
      error_code: 'VALIDATION_ERROR',
      errors: {
        permission_ids: ['The permission ids field must have at least 1 items.']
      },
      request_id: 'request-1'
    });

    expect(error.message).toBe(
      'Validation failed.: Permission Ids: The permission ids field must have at least 1 items.'
    );
    expect(error.message).not.toContain('[object Object]');
    expect(error.validationErrors.permission_ids).toEqual([
      'The permission ids field must have at least 1 items.'
    ]);
  });

  it('flattens nested validation objects defensively', () => {
    const error = new ApiError(422, 'Validation failed.', {
      message: 'Validation failed.',
      errors: {
        details: {
          permission_ids: ['The permission ids field must have at least 1 items.']
        }
      } as unknown as Record<string, string[]>
    });

    expect(error.message).toBe(
      'Validation failed.: Permission Ids: The permission ids field must have at least 1 items.'
    );
    expect(error.message).not.toContain('[object Object]');
  });
});
