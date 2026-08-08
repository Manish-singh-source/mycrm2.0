import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import {
  platformDashboardApi,
  type DashboardDateRange
} from '@/features/platform/dashboard/api/platformDashboardApi';

export function usePlatformDashboardQueries(range: DashboardDateRange) {
  return {
    summary: useQuery({
      queryKey: platformQueryKeys.dashboard('summary', range),
      queryFn: () => platformDashboardApi.summary(range)
    }),
    tenantGrowth: useQuery({
      queryKey: platformQueryKeys.dashboard('tenant-growth', range),
      queryFn: () => platformDashboardApi.tenantGrowth(range)
    }),
    revenue: useQuery({
      queryKey: platformQueryKeys.dashboard('revenue', range),
      queryFn: () => platformDashboardApi.revenue(range)
    }),
    planDistribution: useQuery({
      queryKey: platformQueryKeys.dashboard('plan-distribution', range),
      queryFn: () => platformDashboardApi.planDistribution(range)
    }),
    subscriptionStatus: useQuery({
      queryKey: platformQueryKeys.dashboard('subscription-status', range),
      queryFn: () => platformDashboardApi.subscriptionStatus(range)
    }),
    usage: useQuery({
      queryKey: platformQueryKeys.dashboard('usage', range),
      queryFn: () => platformDashboardApi.usage(range)
    }),
    recentTenants: useQuery({
      queryKey: platformQueryKeys.dashboard('recent-tenants', range),
      queryFn: () => platformDashboardApi.recentTenants(range)
    }),
    recentPayments: useQuery({
      queryKey: platformQueryKeys.dashboard('recent-payments', range),
      queryFn: () => platformDashboardApi.recentPayments(range)
    }),
    overdueInvoices: useQuery({
      queryKey: platformQueryKeys.dashboard('overdue-invoices', range),
      queryFn: () => platformDashboardApi.overdueInvoices(range)
    }),
    activeAlerts: useQuery({
      queryKey: platformQueryKeys.dashboard('active-alerts', range),
      queryFn: () => platformDashboardApi.activeAlerts(range)
    }),
    securityEvents: useQuery({
      queryKey: platformQueryKeys.dashboard('security-events', range),
      queryFn: () => platformDashboardApi.securityEvents(range)
    }),
    failedJobs: useQuery({
      queryKey: platformQueryKeys.dashboard('failed-jobs', range),
      queryFn: () => platformDashboardApi.failedJobs(range)
    }),
    incidents: useQuery({
      queryKey: platformQueryKeys.dashboard('incidents', range),
      queryFn: () => platformDashboardApi.incidents(range)
    })
  };
}

export function usePlatformDashboardMutations(range: DashboardDateRange) {
  const queryClient = useQueryClient();
  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('dashboard') });

  return {
    exportSnapshot: useMutation({
      mutationFn: (format: string) => platformDashboardApi.exportSnapshot(range, format)
    }),
    retryFailedJob: useMutation({
      mutationFn: (jobId: string) => platformDashboardApi.retryFailedJob(jobId),
      onSuccess: invalidateDashboard
    }),
    deleteFailedJob: useMutation({
      mutationFn: (jobId: string) => platformDashboardApi.deleteFailedJob(jobId),
      onSuccess: invalidateDashboard
    }),
    createIncident: useMutation({
      mutationFn: (body: Record<string, unknown>) => platformDashboardApi.createIncident(body),
      onSuccess: invalidateDashboard
    }),
    reviewSecurityEvent: useMutation({
      mutationFn: ({ eventId, body }: { eventId: string; body: Record<string, unknown> }) =>
        platformDashboardApi.reviewSecurityEvent(eventId, body),
      onSuccess: invalidateDashboard
    })
  };
}
