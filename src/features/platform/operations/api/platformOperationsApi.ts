import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type PlatformRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  title?: string;
  status?: string;
  severity?: string;
  priority?: string;
  event?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type PlatformListResult = {
  data: PlatformRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFromPayload(payload: unknown, keys: string[] = []): PlatformRecord[] {
  if (Array.isArray(payload)) return payload as PlatformRecord[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as PlatformRecord[];
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value as PlatformRecord[];
  }
  return [];
}

function recordFromPayload(payload: unknown, keys: string[] = []): PlatformRecord {
  if (!payload || typeof payload !== 'object') return {};
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] && typeof record[key] === 'object' && !Array.isArray(record[key])) {
      return record[key] as PlatformRecord;
    }
  }
  return record as PlatformRecord;
}

async function list(path: string, query?: ApiQuery, keys?: string[]): Promise<PlatformListResult> {
  const response = await platformClient.get<PlatformRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFromPayload(response.data, keys);
  return { data, total: paginationTotal(response.meta, data.length), meta: response.meta };
}

async function detail(path: string, keys?: string[]): Promise<PlatformRecord> {
  const response = await platformClient.get<PlatformRecord | Record<string, unknown>>(path);
  return recordFromPayload(response.data, keys);
}

function key(action: string, id?: string | number) {
  return `${action}-${id ?? 'new'}-${Date.now()}`;
}

export const platformOperationsApi = {
  modules: {
    list: (query?: ApiQuery) => list('/modules', query),
    detail: (id: string) => detail(`/modules/${encodeURIComponent(id)}`, ['module']),
    create: (body: Record<string, unknown>) => platformClient.post('/modules', body, { idempotencyKey: key('module-create') }),
    update: (id: string, body: Record<string, unknown>) => platformClient.patch(`/modules/${encodeURIComponent(id)}`, body),
    enable: (id: string, body?: Record<string, unknown>) => platformClient.post(`/modules/${encodeURIComponent(id)}/enable`, body),
    disable: (id: string, body?: Record<string, unknown>) => platformClient.post(`/modules/${encodeURIComponent(id)}/disable`, body),
    features: (id: string) => platformClient.get(`/modules/${encodeURIComponent(id)}/features`),
    replaceFeatures: (id: string, feature_uuids: string[]) => platformClient.put(`/modules/${encodeURIComponent(id)}/features`, { feature_uuids }),
    tenants: (id: string) => platformClient.get(`/modules/${encodeURIComponent(id)}/tenants`)
  },
  support: {
    tickets: {
      list: (query?: ApiQuery) => list('/support/tickets', query),
      detail: (id: string) => detail(`/support/tickets/${encodeURIComponent(id)}`, ['ticket']),
      create: (body: Record<string, unknown>) => platformClient.post('/support/tickets', body, { idempotencyKey: key('ticket-create') }),
      update: (id: string, body: Record<string, unknown>) => platformClient.patch(`/support/tickets/${encodeURIComponent(id)}`, body),
      assign: (id: string, body: Record<string, unknown>) => platformClient.post(`/support/tickets/${encodeURIComponent(id)}/assign`, body),
      comment: (id: string, body: Record<string, unknown>) => platformClient.post(`/support/tickets/${encodeURIComponent(id)}/comments`, body),
      close: (id: string, body: Record<string, unknown>) => platformClient.post(`/support/tickets/${encodeURIComponent(id)}/close`, body),
      reopen: (id: string, body: Record<string, unknown>) => platformClient.post(`/support/tickets/${encodeURIComponent(id)}/reopen`, body),
      export: (body?: Record<string, unknown>) => platformClient.post('/support/tickets/export', body)
    },
    kbCategories: (query?: ApiQuery) => list('/support/knowledge-base/categories', query),
    articles: {
      list: (query?: ApiQuery) => list('/support/knowledge-base/articles', query),
      detail: (id: string) => detail(`/support/knowledge-base/articles/${encodeURIComponent(id)}`, ['article']),
      create: (body: Record<string, unknown>) => platformClient.post('/support/knowledge-base/articles', body),
      update: (id: string, body: Record<string, unknown>) => platformClient.patch(`/support/knowledge-base/articles/${encodeURIComponent(id)}`, body),
      publish: (id: string, body?: Record<string, unknown>) => platformClient.post(`/support/knowledge-base/articles/${encodeURIComponent(id)}/publish`, body),
      unpublish: (id: string, body?: Record<string, unknown>) => platformClient.post(`/support/knowledge-base/articles/${encodeURIComponent(id)}/unpublish`, body),
      archive: (id: string, body?: Record<string, unknown>) => platformClient.post(`/support/knowledge-base/articles/${encodeURIComponent(id)}/archive`, body)
    },
    remoteSessions: {
      list: (query?: ApiQuery) => list('/support/remote-login-sessions', query),
      detail: (id: string) => detail(`/support/remote-login-sessions/${encodeURIComponent(id)}`, ['session']),
      end: (id: string, body?: Record<string, unknown>) => platformClient.post(`/support/remote-login-sessions/${encodeURIComponent(id)}/end`, body)
    }
  },
  reports: {
    report: async (code: string, query?: ApiQuery) => {
      const response = await platformClient.get<Record<string, unknown>>(`/reports/${encodeURIComponent(code)}`, { query });
      const data = arrayFromPayload(response.data, ['data']);
      return { data, total: data.length, meta: response.meta };
    },
    export: (code: string, body?: Record<string, unknown>) => platformClient.post(`/reports/${encodeURIComponent(code)}/export`, body),
    jobs: (query?: ApiQuery) => list('/reports/export-jobs', query),
    job: (id: string) => detail(`/reports/export-jobs/${encodeURIComponent(id)}`, ['export'])
  },
  monitoring: {
    services: (query?: ApiQuery) => list('/monitoring/services', query),
    apiLogs: (query?: ApiQuery) => list('/monitoring/api-request-logs', query),
    queueJobs: (query?: ApiQuery) => list('/monitoring/queue-jobs', query),
    retryQueueJob: (id: string | number, body?: Record<string, unknown>) => platformClient.post(`/monitoring/queue-jobs/${id}/retry`, body),
    deleteQueueJob: (id: string | number, body?: Record<string, unknown>) => platformClient.delete(`/monitoring/queue-jobs/${id}`, { body }),
    schedulerLogs: (query?: ApiQuery) => list('/monitoring/scheduler-logs', query),
    alerts: (query?: ApiQuery) => list('/monitoring/alerts', query),
    resolveAlert: (id: string | number, body: Record<string, unknown>) => platformClient.post(`/monitoring/alerts/${id}/resolve`, body),
    incidents: (query?: ApiQuery) => list('/monitoring/incidents', query),
    incident: (id: string | number) => detail(`/monitoring/incidents/${id}`, ['incident']),
    createIncident: (body: Record<string, unknown>) => platformClient.post('/monitoring/incidents', body, { idempotencyKey: key('incident-create') }),
    updateIncident: (id: string | number, body: Record<string, unknown>) => platformClient.patch(`/monitoring/incidents/${id}`, body),
    resolveIncident: (id: string | number, body: Record<string, unknown>) => platformClient.post(`/monitoring/incidents/${id}/resolve`, body),
    usage: (query?: ApiQuery) => list('/monitoring/tenant-usage-snapshots', query)
  },
  integrations: {
    providers: (query?: ApiQuery) => list('/integrations/providers', query),
    createProvider: (body: Record<string, unknown>) => platformClient.post('/integrations/providers', body),
    tenantIntegrations: (query?: ApiQuery) => list('/integrations/tenant-integrations', query),
    createTenantIntegration: (body: Record<string, unknown>) => platformClient.post('/integrations/tenant-integrations', body, { idempotencyKey: key('integration-connect') }),
    detail: (id: string) => detail(`/integrations/tenant-integrations/${encodeURIComponent(id)}`, ['integration']),
    rotateCredentials: (id: string, body: Record<string, unknown>) => platformClient.post(`/integrations/tenant-integrations/${encodeURIComponent(id)}/credentials`, body),
    test: (id: string) => platformClient.post(`/integrations/tenant-integrations/${encodeURIComponent(id)}/test`),
    disconnect: (id: string, body?: Record<string, unknown>) => platformClient.post(`/integrations/tenant-integrations/${encodeURIComponent(id)}/disconnect`, body),
    mappings: (id: string) => platformClient.get(`/integrations/tenant-integrations/${encodeURIComponent(id)}/mappings`),
    replaceMappings: (id: string, mappings: Record<string, unknown>[]) => platformClient.put(`/integrations/tenant-integrations/${encodeURIComponent(id)}/mappings`, { mappings }),
    rateLimits: (id: string) => platformClient.get(`/integrations/tenant-integrations/${encodeURIComponent(id)}/rate-limits`),
    webhooks: (query?: ApiQuery) => list('/integrations/webhooks', query),
    syncJobs: (query?: ApiQuery) => list('/integrations/sync-jobs', query),
    retryWebhookLog: (id: string | number, body?: Record<string, unknown>) => platformClient.post(`/integrations/webhook-logs/${id}/retry`, body),
    retrySyncJob: (id: string | number, body?: Record<string, unknown>) => platformClient.post(`/integrations/sync-jobs/${id}/retry`, body)
  },
  settings: {
    platform: () => platformClient.get<Record<string, unknown>>('/settings/platform'),
    updatePlatform: (body: Record<string, unknown>) => platformClient.put('/settings/platform', body),
    templates: (query?: ApiQuery) => list('/settings/notification-templates', query),
    createTemplate: (body: Record<string, unknown>) => platformClient.post('/settings/notification-templates', body),
    updateTemplate: (id: string, body: Record<string, unknown>) => platformClient.patch(`/settings/notification-templates/${encodeURIComponent(id)}`, body),
    backups: () => platformClient.get<Record<string, unknown>>('/settings/backups'),
    updateBackups: (body: Record<string, unknown>) => platformClient.put('/settings/backups', body),
    runBackup: (body?: Record<string, unknown>) => platformClient.post('/settings/backups/run', body),
    backupRuns: (query?: ApiQuery) => list('/settings/backups/runs', query)
  },
  audit: {
    activity: (query?: ApiQuery) => list('/audit/activity-logs', query),
    security: (query?: ApiQuery) => list('/audit/security-events', query),
    reviewSecurity: (id: string | number, body: Record<string, unknown>) => platformClient.post(`/audit/security-events/${id}/review`, body),
    export: (body: Record<string, unknown>) => platformClient.post('/audit/export', body)
  },
  lifecycle: {
    onboarding: (query?: ApiQuery) => list('/onboarding/tenants', query),
    onboardingDetail: (id: string) => detail(`/onboarding/tenants/${encodeURIComponent(id)}`, ['tenant']),
    updateStep: (tenantId: string, stepCode: string, body: Record<string, unknown>) =>
      platformClient.put(`/onboarding/tenants/${encodeURIComponent(tenantId)}/steps/${encodeURIComponent(stepCode)}`, body),
    trials: (query?: ApiQuery) => list('/trials', query),
    extendTrial: (id: string, body: Record<string, unknown>) => platformClient.post(`/trials/${encodeURIComponent(id)}/extend`, body),
    convertTrial: (id: string, body: Record<string, unknown>) => platformClient.post(`/trials/${encodeURIComponent(id)}/convert`, body),
    legal: (query?: ApiQuery) => list('/legal/documents', query),
    createLegal: (body: Record<string, unknown>) => platformClient.post('/legal/documents', body),
    updateLegal: (id: string, body: Record<string, unknown>) => platformClient.patch(`/legal/documents/${encodeURIComponent(id)}`, body),
    publishLegal: (id: string) => platformClient.post(`/legal/documents/${encodeURIComponent(id)}/publish`),
    announcements: (query?: ApiQuery) => list('/announcements', query),
    createAnnouncement: (body: Record<string, unknown>) => platformClient.post('/announcements', body),
    updateAnnouncement: (id: string, body: Record<string, unknown>) => platformClient.patch(`/announcements/${encodeURIComponent(id)}`, body),
    publishAnnouncement: (id: string) => platformClient.post(`/announcements/${encodeURIComponent(id)}/publish`),
    archiveAnnouncement: (id: string) => platformClient.post(`/announcements/${encodeURIComponent(id)}/archive`)
  },
  webhooks: {
    endpoints: (query?: ApiQuery) => list('/webhook-endpoints', query),
    createEndpoint: (body: Record<string, unknown>) => platformClient.post('/webhook-endpoints', body),
    updateEndpoint: (id: string, body: Record<string, unknown>) => platformClient.patch(`/webhook-endpoints/${encodeURIComponent(id)}`, body),
    deliveries: (id: string) => platformClient.get(`/webhook-endpoints/${encodeURIComponent(id)}/deliveries`),
    delivery: (id: string) => detail(`/webhook-deliveries/${encodeURIComponent(id)}`, ['delivery']),
    retryDelivery: (id: string, body?: Record<string, unknown>) => platformClient.post(`/webhook-deliveries/${encodeURIComponent(id)}/retry`, body)
  }
};
