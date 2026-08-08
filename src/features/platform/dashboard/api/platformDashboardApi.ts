import type { ApiQuery } from '@/lib/api/apiTypes';
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

export const platformDashboardApi = {
  summary: (range: DashboardDateRange) =>
    platformClient.get<DashboardSummary>('/dashboard/summary', { query: queryFor(range) }),
  tenantGrowth: (range: DashboardDateRange) =>
    platformClient.get<DashboardChartPoint[]>('/dashboard/charts/tenant-growth', { query: queryFor(range) }),
  revenue: (range: DashboardDateRange) =>
    platformClient.get<DashboardChartPoint[]>('/dashboard/charts/revenue', { query: queryFor(range) }),
  planDistribution: (range: DashboardDateRange) =>
    platformClient.get<DashboardChartPoint[]>('/dashboard/charts/plan-distribution', { query: queryFor(range) }),
  subscriptionStatus: (range: DashboardDateRange) =>
    platformClient.get<DashboardChartPoint[]>('/dashboard/charts/subscription-status', { query: queryFor(range) }),
  usage: (range: DashboardDateRange) =>
    platformClient.get<DashboardChartPoint[]>('/dashboard/charts/usage', { query: queryFor(range) }),
  recentTenants: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/dashboard/recent-tenants', { query: queryFor(range) }),
  recentPayments: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/dashboard/recent-payments', { query: queryFor(range) }),
  overdueInvoices: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/dashboard/overdue-invoices', { query: queryFor(range) }),
  activeAlerts: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/dashboard/active-alerts', { query: queryFor(range) }),
  securityEvents: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/dashboard/security-events', { query: queryFor(range) }),
  failedJobs: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/monitoring/queue-jobs', {
      query: { ...queryFor(range), filter: { status: 'failed' } }
    }),
  incidents: (range: DashboardDateRange) =>
    platformClient.get<DashboardTableRow[]>('/monitoring/incidents', {
      query: { ...queryFor(range), filter: { status: ['open', 'investigating', 'active'] } }
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
