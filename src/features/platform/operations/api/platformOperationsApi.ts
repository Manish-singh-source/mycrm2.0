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
  onboarding: (query?: ApiQuery) => list('/onboarding/tenants', query),
  onboardingDetail: (value: string) => detail('/onboarding/tenants/' + id(value), ['tenant']),
  updateOnboardingStep: (tenantUuid: string, stepCode: string, body: Record<string, unknown>) => platformClient.put('/onboarding/tenants/' + id(tenantUuid) + '/steps/' + id(stepCode), body)
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
const remoteSessions = {
  list: (query?: ApiQuery) => list('/remote-login-sessions', query),
  detail: (value: string) => detail('/remote-login-sessions/' + id(value), ['session']),
  end: (value: string, body?: Record<string, unknown>) => platformClient.post('/remote-login-sessions/' + id(value) + '/end', body)
};
const articles = {
  list: (query?: ApiQuery) => list('/support/knowledge-base/articles', query),
  detail: (value: string) => detail('/support/knowledge-base/articles/' + id(value), ['article']),
  create: (body: Record<string, unknown>) => platformClient.post('/support/knowledge-base/articles', body),
  update: (value: string, body: Record<string, unknown>) => platformClient.patch('/support/knowledge-base/articles/' + id(value), body),
  publish: (value: string, body?: Record<string, unknown>) => platformClient.post('/support/knowledge-base/articles/' + id(value) + '/publish', body),
  unpublish: (value: string, body?: Record<string, unknown>) => platformClient.post('/support/knowledge-base/articles/' + id(value) + '/unpublish', body),
  archive: (value: string, body?: Record<string, unknown>) => platformClient.post('/support/knowledge-base/articles/' + id(value) + '/archive', body)
};
const kbCategories = {
  list: (query?: ApiQuery) => list('/support/knowledge-base/categories', query),
  create: (body: Record<string, unknown>) => platformClient.post('/support/knowledge-base/categories', body),
  update: (value: string, body: Record<string, unknown>) => platformClient.patch('/support/knowledge-base/categories/' + id(value), body)
};
const support = {
  tickets: {
    list: (query?: ApiQuery) => list('/support/tickets', query),
    detail: (value: string) => detail('/support/tickets/' + id(value), ['ticket']),
    create: (body: Record<string, unknown>) => platformClient.post('/support/tickets', body),
    update: (value: string, body: Record<string, unknown>) => platformClient.patch('/support/tickets/' + id(value), body),
    assign: (value: string, body: Record<string, unknown>) => platformClient.post('/support/tickets/' + id(value) + '/assign', body),
    comment: (value: string, body: Record<string, unknown>) => platformClient.post('/support/tickets/' + id(value) + '/comments', body),
    attach: (value: string, body: unknown) => platformClient.post('/support/tickets/' + id(value) + '/attachments', body),
    close: (value: string, body?: Record<string, unknown>) => platformClient.post('/support/tickets/' + id(value) + '/close', body),
    reopen: (value: string, body?: Record<string, unknown>) => platformClient.post('/support/tickets/' + id(value) + '/reopen', body),
    export: (body: Record<string, unknown>) => platformClient.post('/support/tickets/export', body)
  },
  remoteSessions,
  articles,
  kbCategories
};
const integrations = {
  providers: (_query?: ApiQuery) => Promise.resolve({ data: [], total: 0, meta: {} }),
  createProvider: (_body: Record<string, unknown>) => Promise.reject(new Error('Integration provider management is not available on this API.')),
  updateProvider: (_value: string, _body: Record<string, unknown>) => Promise.reject(new Error('Integration provider management is not available on this API.')),
  tenantIntegrations: (query?: ApiQuery) => list('/tenant-integrations', query),
  tenantIntegration: (value: string) => detail('/tenant-integrations/' + id(value), ['integration']),
  mappings: (value: string) => platformClient.get('/tenant-integrations/' + id(value) + '/mappings'),
  rateLimits: (value: string) => platformClient.get('/tenant-integrations/' + id(value) + '/rate-limits'),
  syncJobs: (query?: ApiQuery) => list('/sync-jobs', query),
  update: (value: string, body: Record<string, unknown>) => platformClient.patch('/tenant-integrations/' + id(value), body),
  test: (value: string) => platformClient.post('/tenant-integrations/' + id(value) + '/test', {}),
  disconnect: (value: string) => platformClient.post('/tenant-integrations/' + id(value) + '/disconnect', {}),
  retryJob: (value: string) => platformClient.post('/sync-jobs/' + id(value) + '/retry', {}),
  detail: (value: string) => detail('/tenant-integrations/' + id(value), ['integration']),
  createTenantIntegration: (body: Record<string, unknown>) => platformClient.post('/tenant-integrations', body),
  updateTenantIntegration: (value: string, body: Record<string, unknown>) => platformClient.patch('/tenant-integrations/' + id(value), body),
  rotateCredentials: (value: string, body: Record<string, unknown>) => platformClient.post('/tenant-integrations/' + id(value) + '/credentials', body),
  replaceMappings: (value: string, body: Record<string, unknown>) => platformClient.put('/tenant-integrations/' + id(value) + '/mappings', body),
  retrySyncJob: (value: string) => platformClient.post('/sync-jobs/' + id(value) + '/retry', {}),
  webhooks: (query?: ApiQuery) => list('/webhooks', query),
  webhook: (value: string | number) => detail('/webhooks/' + id(value), ['webhook']),
  updateWebhook: (value: string | number, body: Record<string, unknown>) => platformClient.patch('/webhooks/' + id(value), body),
  createWebhook: (body: Record<string, unknown>) => platformClient.post('/webhooks', body),
  disableWebhook: (value: string | number) => platformClient.delete('/webhooks/' + id(value)),
  webhookLogs: (value: string | number, query?: ApiQuery) => platformClient.get('/webhooks/' + id(value) + '/logs', { query: query as any }),
  retryWebhookLog: (value: string | number) => platformClient.post('/webhook-logs/' + id(value) + '/retry', {})
};

const reports = {
  jobs: (query?: ApiQuery) => list('/reports/export-jobs', query),
  report: (code: string, query?: ApiQuery) => platformClient.get('/reports/' + id(code), { query: query as any }),
  export: (code: string, body: Record<string, unknown>) => platformClient.post('/reports/' + id(code) + '/export', body)
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
  integrations,
  references: fallback.references,
  reports,
  settings: fallback.settings,
  support,
  webhooks: fallback.webhooks
};
