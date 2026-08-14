import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type TenantRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  title?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
};

export type TenantListResult = {
  data: TenantRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

function tenantClient() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFrom(data: unknown, keys: string[] = []) {
  if (Array.isArray(data)) return data as TenantRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as TenantRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as TenantRecord[];
  }
  return [];
}

async function list(path: string, query?: ApiQuery, keys?: string[]): Promise<TenantListResult> {
  const response = await tenantClient().get<TenantRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: paginationTotal(response.meta, data.length), meta: response.meta };
}

export const tenantWorkspaceApi = {
  navigation: () => tenantClient().get<Record<string, unknown>>('/navigation/sidebar'),
  dashboard: {
    summary: () => tenantClient().get<Record<string, unknown>>('/dashboard/summary'),
    chart: (chart: string) => tenantClient().get<Record<string, unknown>>(`/dashboard/charts/${encodeURIComponent(chart)}`),
    table: (widget: string, query?: ApiQuery) => list(`/dashboard/${encodeURIComponent(widget)}`, query),
    recentActivities: (query?: ApiQuery) => list('/dashboard/recent-activities', query),
    widgets: () => tenantClient().get<Record<string, unknown>>('/dashboard/widgets'),
    updateWidgets: (widgets: Record<string, unknown>[]) => tenantClient().put('/dashboard/widgets', { widgets }),
    export: (body: Record<string, unknown>) => tenantClient().post('/dashboard/export', body)
  },
  notifications: {
    list: (query?: ApiQuery) => list('/notifications', query),
    unreadCount: () => tenantClient().get<{ unread_count: number }>('/notifications/unread-count'),
    read: (id: string | number) => tenantClient().post(`/notifications/${id}/read`),
    unread: (id: string | number) => tenantClient().post(`/notifications/${id}/unread`),
    bulkRead: (ids: Array<string | number>) => tenantClient().post('/notifications/bulk/read', { ids }),
    delete: (id: string | number) => tenantClient().delete(`/notifications/${id}`)
  },
  activity: {
    list: (query?: ApiQuery) => list('/activity-logs', query),
    compare: (id: string | number) => tenantClient().get<Record<string, unknown>>(`/activity-logs/${id}/compare`)
  },
  help: {
    articles: (query?: ApiQuery) => list('/help/articles', query, ['articles']),
    article: (slug: string) => tenantClient().get<{ article: TenantRecord }>(`/help/articles/${encodeURIComponent(slug)}`),
    faqs: () => tenantClient().get<Record<string, unknown>>('/help/faqs'),
    releaseNotes: () => tenantClient().get<Record<string, unknown>>('/help/release-notes'),
    systemStatus: () => tenantClient().get<Record<string, unknown>>('/help/system-status'),
    contactSupport: (body: Record<string, unknown>) => tenantClient().post('/help/contact-support', body)
  }
};
