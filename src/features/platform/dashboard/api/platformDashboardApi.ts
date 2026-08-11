import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type DashboardDateRange = {
  date_from?: string;
  date_to?: string;
};

export type DashboardSummary = Record<string, unknown>;
export type DashboardChartPoint = Record<string, string | number | null | undefined>;
export type DashboardTableRow = Record<string, unknown>;

const queryFor = (range: DashboardDateRange): ApiQuery => ({
  date_from: range.date_from,
  date_to: range.date_to
});

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickArray(payload: unknown, keys: string[]): DashboardChartPoint[] {
  if (Array.isArray(payload)) return payload as DashboardChartPoint[];
  const record = asRecord(payload);
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as DashboardChartPoint[];
    const nested = asRecord(value);
    if (Array.isArray(nested.data)) return nested.data as DashboardChartPoint[];
    if (Array.isArray(nested.items)) return nested.items as DashboardChartPoint[];
    if (Array.isArray(nested.rows)) return nested.rows as DashboardChartPoint[];
  }
  if (Array.isArray(record.data)) return record.data as DashboardChartPoint[];
  return [];
}

async function chartEndpoint(
  path: string,
  range: DashboardDateRange,
  fallbackKeys: string[]
): Promise<NormalizedApiResponse<DashboardChartPoint[]>> {
  try {
    const response = await platformClient.get<DashboardChartPoint[] | Record<string, unknown>>(path, { query: queryFor(range) });
    return { ...response, data: pickArray(response.data, fallbackKeys) };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const response = await platformClient.get<Record<string, unknown>>('/dashboard/charts', { query: queryFor(range) });
    return { ...response, data: pickArray(response.data, fallbackKeys) };
  }
}

async function tableEndpoint(
  path: string,
  range: DashboardDateRange,
  fallbackPath: '/dashboard/recent' | '/dashboard/alerts',
  fallbackKeys: string[]
): Promise<NormalizedApiResponse<DashboardTableRow[]>> {
  try {
    const response = await platformClient.get<DashboardTableRow[] | Record<string, unknown>>(path, { query: queryFor(range) });
    return { ...response, data: pickArray(response.data, fallbackKeys) as DashboardTableRow[] };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const response = await platformClient.get<Record<string, unknown>>(fallbackPath, { query: queryFor(range) });
    return { ...response, data: pickArray(response.data, fallbackKeys) as DashboardTableRow[] };
  }
}

export const platformDashboardApi = {
  summary: (range: DashboardDateRange) =>
    platformClient.get<DashboardSummary>('/dashboard/summary', { query: queryFor(range) }),
  tenantGrowth: (range: DashboardDateRange) =>
    chartEndpoint('/dashboard/charts/tenant-growth', range, ['tenant_growth', 'tenantGrowth', 'tenants', 'growth']),
  revenue: (range: DashboardDateRange) =>
    chartEndpoint('/dashboard/charts/revenue', range, ['revenue', 'revenue_chart', 'revenueChart']),
  planDistribution: (range: DashboardDateRange) =>
    chartEndpoint('/dashboard/charts/plan-distribution', range, ['plan_distribution', 'planDistribution', 'plans']),
  subscriptionStatus: (range: DashboardDateRange) =>
    chartEndpoint('/dashboard/charts/subscription-status', range, ['subscription_status', 'subscriptionStatus', 'tenant_status', 'tenantStatus', 'subscriptions']),
  usage: (range: DashboardDateRange) =>
    chartEndpoint('/dashboard/charts/usage', range, ['usage', 'usage_chart', 'usageChart', 'api_usage', 'storage_usage', 'payment_trend']),
  recentTenants: (range: DashboardDateRange) =>
    tableEndpoint('/dashboard/recent-tenants', range, '/dashboard/recent', ['recent_tenants', 'recentTenants', 'tenants']),
  recentPayments: (range: DashboardDateRange) =>
    tableEndpoint('/dashboard/recent-payments', range, '/dashboard/recent', ['recent_payments', 'recentPayments', 'payments']),
  overdueInvoices: (range: DashboardDateRange) =>
    tableEndpoint('/dashboard/overdue-invoices', range, '/dashboard/recent', ['overdue_invoices', 'overdueInvoices', 'invoices']),
  activeAlerts: (range: DashboardDateRange) =>
    tableEndpoint('/dashboard/active-alerts', range, '/dashboard/alerts', ['active_alerts', 'activeAlerts', 'alerts']),
  securityEvents: (range: DashboardDateRange) =>
    tableEndpoint('/dashboard/security-events', range, '/dashboard/alerts', ['security_events', 'securityEvents', 'events']),
  failedJobs: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/monitoring/queue-jobs', {
      query: { ...queryFor(range), status: 'failed' }
    }),
  incidents: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/monitoring/incidents', {
      query: { ...queryFor(range), status: ['open', 'investigating', 'active'] }
    }),
  exportSnapshot: (range: DashboardDateRange, format: string) =>
    platformClient.post<{ export_id?: string; file_url?: string; queued?: boolean }, { format: string }>(
      '/dashboard/export',
      { format },
      { query: queryFor(range) }
    ),
  retryFailedJob: (jobId: string) => platformClient.post<Record<string, unknown>>(`/monitoring/queue-jobs/${encodeURIComponent(jobId)}/retry`),
  deleteFailedJob: (jobId: string) => platformClient.delete<Record<string, unknown>>(`/monitoring/queue-jobs/${encodeURIComponent(jobId)}`),
  createIncident: (body: Record<string, unknown>) =>
    platformClient.post<DashboardTableRow, Record<string, unknown>>('/monitoring/incidents', body),
  reviewSecurityEvent: (eventId: string, body: Record<string, unknown>) =>
    platformClient.post<Record<string, unknown>, Record<string, unknown>>(
      `/audit/security-events/${encodeURIComponent(eventId)}/review`,
      body
    )
};
