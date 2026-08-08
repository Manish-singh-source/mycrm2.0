import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { ApiError } from '@/lib/api/apiError';

export function applyApiValidationErrors<TForm extends FieldValues>(form: UseFormReturn<TForm>, error: unknown) {
  if (!(error instanceof ApiError) || !error.isValidationError) return false;

  Object.entries(error.validationErrors).forEach(([field, messages]) => {
    form.setError(field as Path<TForm>, {
      type: 'server',
      message: Array.isArray(messages) ? messages.join(' ') : String(messages)
    });
  });

  return true;
}
