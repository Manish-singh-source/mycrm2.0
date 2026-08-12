import { describe, expect, it } from 'vitest';

import { assignmentSchema, auditReasonSchema, exportOptionsSchema, importFileSchema } from './enterpriseSchemas';

describe('enterprise validation schemas', () => {
  it('requires audit reasons for risky actions', () => {
    expect(auditReasonSchema.safeParse({ reason: 'Reviewed by finance' }).success).toBe(true);
    expect(auditReasonSchema.safeParse({ reason: '' }).success).toBe(false);
  });

  it('validates export options', () => {
    expect(exportOptionsSchema.parse({ format: 'CSV', delivery: 'job', scope: 'filtered', timezone: 'Asia/Kolkata', emailWhenReady: false }).format).toBe('CSV');
    expect(exportOptionsSchema.safeParse({ format: 'JSON', delivery: 'job', scope: 'filtered', timezone: 'UTC', emailWhenReady: false }).success).toBe(false);
  });

  it('requires an assignee user or team', () => {
    expect(assignmentSchema.safeParse({ user_id: 'user-1', notify: true }).success).toBe(true);
    expect(assignmentSchema.safeParse({ notify: true }).success).toBe(false);
  });

  it('accepts supported import files only', () => {
    expect(importFileSchema.safeParse({ fileName: 'staff.csv', size: 1024 }).success).toBe(true);
    expect(importFileSchema.safeParse({ fileName: 'staff.json', size: 1024 }).success).toBe(false);
  });
});
