import { platformClient } from '@/lib/api/platformClient';
import type { ApiQuery } from '@/lib/api/apiTypes';

export type PlatformRecord = { id?: string | number; uuid?: string; code?: string; [key: string]: unknown };
export type PlatformListResult = { data: PlatformRecord[]; total: number; meta?: Record<string, unknown> };

function rows(data: unknown): PlatformRecord[] {
  if (Array.isArray(data)) return data as PlatformRecord[];
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const value of Object.values(record)) if (Array.isArray(value)) return value as PlatformRecord[];
  return [];
}
function total(meta: Record<string, unknown> | undefined, fallback: number) {
  const pagination = meta?.pagination as Record<string, unknown> | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}
async function list(path: string, query?: ApiQuery): Promise<PlatformListResult> {
  const response = await platformClient.get<unknown>(path, { query: query as any });
  const data = rows(response.data);
  return { data, total: total(response.meta, data.length), meta: response.meta };
}
async function detail(path: string, keys: string[] = []): Promise<PlatformRecord> {
  const response = await platformClient.get<unknown>(path);
  if (!response.data || typeof response.data !== 'object') return {};
  const record = response.data as Record<string, unknown>;
  for (const key of keys) if (record[key] && typeof record[key] === 'object') return record[key] as PlatformRecord;
  return record as PlatformRecord;
}
const id = (value: string | number) => encodeURIComponent(String(value));

const lifecycle = {
  announcements: (query?: ApiQuery) => list('/announcements', query),
  announcement: (value: string) => detail(`/announcements/${id(value)}`, ['announcement']),
  createAnnouncement: (body: Record<string, unknown>) => platformClient.post('/announcements', body),
  updateAnnouncement: (value: string, body: Record<string, unknown>) => platformClient.patch(`/announcements/${id(value)}`, body),
  publishAnnouncement: (value: string) => platformClient.post(`/announcements/${id(value)}/publish`),
  archiveAnnouncement: (value: string, body?: Record<string, unknown>) => platformClient.post(`/announcements/${id(value)}/archive`, body),
  deleteAnnouncement: (value: string, body?: Record<string, unknown>) => platformClient.delete(`/announcements/${id(value)}`, { body }),
  legal: (query?: ApiQuery) => list('/legal/documents', query),
  createLegal: (body: Record<string, unknown>) => platformClient.post('/legal/documents', body),
  updateLegal: (value: string, body: Record<string, unknown>) => platformClient.patch(`/legal/documents/${id(value)}`, body),
  publishLegal: (value: string) => platformClient.post(`/legal/documents/${id(value)}/publish`),
  trials: (query?: ApiQuery) => list('/trials', query),
  extendTrial: (value: string, body: Record<string, unknown>) => platformClient.post(`/trials/${id(value)}/extend`, body),
  convertTrial: (value: string, body: Record<string, unknown>) => platformClient.post(`/trials/${id(value)}/convert`, body),
  onboarding: (query?: ApiQuery) => list('/onboarding/tenants', query)
};

const audit = {
  activity: (query?: ApiQuery) => list('/audit/activity-logs', query),
  security: (query?: ApiQuery) => list('/audit/security-events', query),
  reviewSecurity: (value: string | number, body: Record<string, unknown>) => platformClient.post(`/audit/security-events/${id(value)}/review`, body),
  export: (body: Record<string, unknown>) => platformClient.post('/audit/export', body)
};

const modules = {
  list: (query?: ApiQuery) => list('/modules', query),
  detail: (value: string) => detail(`/modules/${id(value)}`, ['module']),
  create: (body: Record<string, unknown>) => platformClient.post('/modules', body),
  update: (value: string, body: Record<string, unknown>) => platformClient.patch(`/modules/${id(value)}`, body),
  delete: (value: string) => platformClient.delete(`/modules/${id(value)}`),
  bulkDelete: (uuids: string[]) => platformClient.delete('/modules/bulk', { body: { module_uuids: uuids } }),
  enable: (value: string) => platformClient.post(`/modules/${id(value)}/enable`),
  disable: (value: string) => platformClient.post(`/modules/${id(value)}/disable`),
  features: (value: string) => platformClient.get(`/modules/${id(value)}/features`),
  tenants: (value: string) => platformClient.get(`/modules/${id(value)}/tenants`),
  replaceFeatures: (value: string, feature_uuids: string[]) => platformClient.put(`/modules/${id(value)}/features`, { feature_uuids }),
  export: () => platformClient.post('/modules/export'),
  import: () => platformClient.post('/modules/import')
};
const fallback: any = new Proxy({}, { get: (_target, namespace: string) => new Proxy({}, { get: (_inner, method: string) => (..._args: unknown[]) => {
  if (['list', 'services', 'queueJobs', 'schedulerLogs', 'apiLogs', 'alerts', 'incidents', 'usage', 'providers', 'tenantIntegrations', 'syncJobs', 'endpoints', 'tickets', 'articles', 'legal'].includes(method)) return Promise.resolve({ data: [], total: 0 });
  return Promise.resolve({ data: null });
} }) });

export const platformOperationsApi: any = {
  lifecycle,
  audit,
  modules,
  monitoring: fallback.monitoring,
  integrations: fallback.integrations,
  references: fallback.references,
  reports: fallback.reports,
  settings: fallback.settings,
  support: fallback.support,
  webhooks: fallback.webhooks
};
