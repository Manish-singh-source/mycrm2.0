import { z } from 'zod';

export const auditReasonSchema = z.object({
  reason: z.string().trim().min(3, 'Reason is required.').max(1000)
});

export const exportOptionsSchema = z.object({
  format: z.enum(['CSV', 'XLSX', 'PDF']),
  delivery: z.enum(['job', 'download']),
  scope: z.enum(['filtered', 'selected']),
  timezone: z.string().trim().min(1),
  emailWhenReady: z.boolean()
});

export const assignmentSchema = z.object({
  user_id: z.string().trim().optional(),
  team_id: z.string().trim().optional(),
  role_id: z.string().trim().optional(),
  effective_date: z.string().trim().optional(),
  notify: z.boolean(),
  remarks: z.string().trim().max(1000).optional()
}).refine((value) => Boolean(value.user_id || value.team_id), {
  message: 'Select a user or team.',
  path: ['user_id']
});

export const importFileSchema = z.object({
  fileName: z.string().regex(/\.(csv|xlsx)$/i, 'Use a CSV or XLSX file.'),
  size: z.number().max(10 * 1024 * 1024, 'File must be 10 MB or smaller.')
});
