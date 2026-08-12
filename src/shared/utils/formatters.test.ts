import { describe, expect, it } from 'vitest';

import { formatCurrency, formatDate, formatDateTime, maskSecret } from './formatters';

describe('formatters', () => {
  it('formats money and handles invalid values', () => {
    expect(formatCurrency(1234, 'INR')).toContain('1,234.00');
    expect(formatCurrency('bad')).toBe('Not set');
  });

  it('formats dates with stable fallbacks', () => {
    expect(formatDate('2026-08-12')).toContain('12');
    expect(formatDate(null)).toBe('Not set');
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });

  it('formats date-times without exposing raw date objects', () => {
    expect(formatDateTime('2026-08-12T10:30:00Z')).toContain('2026');
  });

  it('masks secrets while preserving copy-once hints', () => {
    expect(maskSecret('tok_1234567890')).toBe('**********7890');
    expect(maskSecret('abc')).toBe('***');
    expect(maskSecret('')).toBe('Not set');
  });
});
