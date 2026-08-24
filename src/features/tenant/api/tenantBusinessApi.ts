import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type BusinessRecord = {
  id?: string | number;
  uuid?: string;
  name?: string;
  title?: string;
  display_name?: string;
  status?: string;
  [key: string]: unknown;
};

export type BusinessListResult = {
  data: BusinessRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

function client() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function total(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFrom(data: unknown, keys: string[] = []): BusinessRecord[] {
  if (Array.isArray(data)) return data as BusinessRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as BusinessRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as BusinessRecord[];
  }
  return [];
}

async function list(path: string, query?: ApiQuery, keys: string[] = []): Promise<BusinessListResult> {
  const response = await client().get<BusinessRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: total(response.meta, data.length), meta: response.meta };
}

async function detail(path: string) {
  const response = await client().get<BusinessRecord | Record<string, unknown>>(path);
  return response.data as BusinessRecord;
}

export const tenantBusinessApi = {
  selectors: () => client().get<Record<string, BusinessRecord[]>>('/business/selectors'),
  finance: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/finance/dashboard'),
    invoices: {
      list: (query?: ApiQuery) => list('/invoices', query, ['invoices']),
      create: (body: Record<string, unknown>) => client().post('/invoices', body),
      detail: (id: string) => detail(`/invoices/${encodeURIComponent(id)}`),
      update: (id: string, body: Record<string, unknown>) => client().patch(`/invoices/${encodeURIComponent(id)}`, body),
      addItem: (id: string, body: Record<string, unknown>) => client().post(`/invoices/${encodeURIComponent(id)}/items`, body),
      updateItem: (id: string, itemId: string | number, body: Record<string, unknown>) => client().patch(`/invoices/${encodeURIComponent(id)}/items/${encodeURIComponent(String(itemId))}`, body),
      deleteItem: (id: string, itemId: string | number) => client().delete(`/invoices/${encodeURIComponent(id)}/items/${encodeURIComponent(String(itemId))}`),
      send: (id: string, body: Record<string, unknown>) => client().post(`/invoices/${encodeURIComponent(id)}/send`, body),
      cancel: (id: string, body?: Record<string, unknown>) => client().post(`/invoices/${encodeURIComponent(id)}/cancel`, body),
      pdf: (id: string) => client().get<Record<string, unknown>>(`/invoices/${encodeURIComponent(id)}/pdf`),
      export: (body: Record<string, unknown>) => client().post('/invoices/export', body)
    },
    payments: {
      list: (query?: ApiQuery) => list('/payments', query, ['payments']),
      create: (body: Record<string, unknown>) => client().post('/payments', body),
      detail: (id: string) => detail(`/payments/${encodeURIComponent(id)}`),
      void: (id: string, body?: Record<string, unknown>) => client().post(`/payments/${encodeURIComponent(id)}/void`, body),
      receipt: (id: string) => client().get<Record<string, unknown>>(`/payments/${encodeURIComponent(id)}/receipt`),
      export: (body: Record<string, unknown>) => client().post('/payments/export', body)
    },
    expenses: {
      list: (query?: ApiQuery) => list('/expenses', query, ['expenses']),
      create: (body: Record<string, unknown>) => client().post('/expenses', body),
      detail: (id: string) => detail(`/expenses/${encodeURIComponent(id)}`),
      update: (id: string, body: Record<string, unknown>) => client().patch(`/expenses/${encodeURIComponent(id)}`, body),
      approve: (id: string, body?: Record<string, unknown>) => client().post(`/expenses/${encodeURIComponent(id)}/approve`, body),
      reject: (id: string, body?: Record<string, unknown>) => client().post(`/expenses/${encodeURIComponent(id)}/reject`, body),
      export: (body: Record<string, unknown>) => client().post('/expenses/export', body)
    },
    bankAccounts: {
      list: (query?: ApiQuery) => list('/bank-accounts', query, ['bank_accounts']),
      create: (body: Record<string, unknown>) => client().post('/bank-accounts', body),
      update: (id: string | number, body: Record<string, unknown>) => client().patch(`/bank-accounts/${encodeURIComponent(String(id))}`, body),
      delete: (id: string | number) => client().delete(`/bank-accounts/${encodeURIComponent(String(id))}`),
      primary: (id: string | number, body?: Record<string, unknown>) => client().post(`/bank-accounts/${encodeURIComponent(String(id))}/set-primary`, body)
    }
  },
  documents: {
    dashboard: (query?: ApiQuery) => list('/documents/dashboard', query, ['files']),
    files: (query?: ApiQuery) => list('/files', query, ['files']),
    upload: (body: FormData) => client().post('/files', body),
    download: (id: string) => client().get<{ url: string; expires_at: string | null }>(`/files/${encodeURIComponent(id)}/download`),
    delete: (id: string) => client().delete(`/files/${encodeURIComponent(id)}`),
    folders: () => client().get<{ folders: BusinessRecord[] }>('/document-folders'),
    createFolder: (body: Record<string, unknown>) => client().post('/document-folders', body),
    attachToFolder: (id: string, body: Record<string, unknown>) => client().post(`/document-folders/${encodeURIComponent(id)}/files`, body)
  },
  reports: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/reports/dashboard'),
    report: (code: string, query?: ApiQuery) => client().get<Record<string, unknown>>(`/reports/${encodeURIComponent(code)}`, { query }),
    export: (code: string, body: Record<string, unknown>) => client().post(`/reports/${encodeURIComponent(code)}/export`, body),
    custom: () => client().get<Record<string, unknown>>('/reports/custom'),
    saveCustom: (body: Record<string, unknown>) => client().post('/reports/custom', body)
  },
  communication: {
    logs: (query?: ApiQuery) => list('/communication/logs', query, ['logs', 'communication_logs']),
    send: (body: Record<string, unknown>) => client().post('/communication/email', body),
    sendSms: (body: Record<string, unknown>) => client().post('/communication/sms', body),
    sendWhatsApp: (body: Record<string, unknown>) => client().post('/communication/whatsapp', body),
    sendPush: (body: Record<string, unknown>) => client().post('/communication/push', body),
    retry: (id: string) => client().post(`/communication/logs/${encodeURIComponent(id)}/retry`)
  },
  settings: {
    group: (group: string) => client().get<Record<string, unknown>>(`/settings/${encodeURIComponent(group)}`),
    saveGroup: (group: string, body: Record<string, unknown>) => client().put(`/settings/${encodeURIComponent(group)}`, body),
    lookups: () => client().get<{ lookups: BusinessRecord[] }>('/settings/lookups'),
    reorderLookups: (items: BusinessRecord[]) => client().put('/settings/lookups/reorder', { items }),
    deleteLookup: (id: string, body?: Record<string, unknown>) => client().delete(`/settings/lookups/${encodeURIComponent(id)}`, { body }),
    templates: (query?: ApiQuery) => list('/settings/notification-templates', query, ['templates']),
    createTemplate: (body: Record<string, unknown>) => client().post('/settings/notification-templates', body),
    updateTemplate: (id: string, body: Record<string, unknown>) => client().patch(`/settings/notification-templates/${encodeURIComponent(id)}`, body),
    testTemplate: (id: string, body: Record<string, unknown>) => client().post(`/settings/notification-templates/${encodeURIComponent(id)}/test-send`, body),
    backups: (query?: ApiQuery) => list('/settings/backups/runs', query, ['backups']),
    runBackup: (body: Record<string, unknown>) => client().post('/settings/backups/run', body),
    restoreBackup: (body: Record<string, unknown>) => client().post('/settings/backups/restore', body)
  },
  integrations: {
    providers: (query?: ApiQuery) => list('/integrations/providers', query, ['providers']),
    list: (query?: ApiQuery) => list('/integrations', query, ['integrations']),
    connect: (body: Record<string, unknown>) => client().post('/integrations', body),
    detail: (id: string) => detail(`/integrations/${encodeURIComponent(id)}`),
    update: (id: string, body: Record<string, unknown>) => client().patch(`/integrations/${encodeURIComponent(id)}`, body),
    rotate: (id: string, body: Record<string, unknown>) => client().post(`/integrations/${encodeURIComponent(id)}/credentials/rotate`, body),
    disconnect: (id: string, body?: Record<string, unknown>) => client().post(`/integrations/${encodeURIComponent(id)}/disconnect`, body),
    webhooks: (query?: ApiQuery) => list('/integrations/webhooks', query, ['webhooks']),
    syncJobs: (query?: ApiQuery) => list('/integrations/sync-jobs', query, ['sync_jobs']),
    retrySync: (id: string | number) => client().post(`/integrations/sync-jobs/${encodeURIComponent(String(id))}/retry`),
    mappings: (id: string) => client().get<{ mappings: BusinessRecord[] }>(`/integrations/${encodeURIComponent(id)}/field-mappings`),
    saveMappings: (id: string, mappings: BusinessRecord[]) => client().put(`/integrations/${encodeURIComponent(id)}/field-mappings`, { mappings }),
    rateLimits: (id: string) => client().get<{ rate_limits: BusinessRecord[] }>(`/integrations/${encodeURIComponent(id)}/rate-limits`)
  },
  audit: {
    list: (type: string, query?: ApiQuery) => list(`/audit/${encodeURIComponent(type)}`, query),
    compare: (id: string | number) => client().get<Record<string, unknown>>(`/audit/activity-logs/${encodeURIComponent(String(id))}/compare`),
    export: (body: Record<string, unknown>) => client().post('/audit/export', body)
  }
};
