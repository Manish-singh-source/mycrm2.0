import { z } from 'zod';

const envSchema = z.object({
  appName: z.string().min(1),
  appEnv: z.enum(['local', 'development', 'staging', 'production', 'test']).default('local'),
  platformApiBaseUrl: z.string().min(1),
  tenantApiBaseUrl: z.string().min(1),
  clientVersion: z.string().min(1),
  enableQueryDevtools: z.boolean()
});

export const env = envSchema.parse({
  appName: import.meta.env.VITE_APP_NAME ?? 'Enterprise CRM',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'local',
  platformApiBaseUrl: import.meta.env.VITE_PLATFORM_API_BASE_URL ?? '/api/platform/v1',
  tenantApiBaseUrl: import.meta.env.VITE_TENANT_API_BASE_URL ?? '/api/tenant/v1',
  clientVersion: import.meta.env.VITE_CLIENT_VERSION ?? 'web-admin/0.1.0',
  enableQueryDevtools: import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS === 'true'
});
