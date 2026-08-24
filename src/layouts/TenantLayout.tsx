import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellPlus, CalendarPlus2, Plus, ReceiptText } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionPreferences } from '@/features/auth/hooks/useSessionPreferences';
import { useTenantContext } from '@/features/auth/hooks/useTenantContext';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantWorkspaceApi } from '@/features/tenant/api/tenantWorkspaceApi';
import { buildTenantNavigation } from '@/features/tenant/navigation/tenantNavigation';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import {
  AppShell,
  AppTopbar
} from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';
import { PermissionButton } from '@/shared/components/ui';

export function TenantLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenantSlug = ':tenantSlug' } = useParams();
  const { user, logout } = useAuth('tenant');
  const { locale, timezone } = useSessionPreferences('tenant');
  const { tenant } = useTenantContext();
  const navigationQuery = useQuery({
    queryKey: tenantQueryKeys.resource(tenant?.slug ?? tenantSlug, 'navigation-sidebar'),
    queryFn: tenantWorkspaceApi.navigation,
    enabled: Boolean(tenant)
  });
  const unreadQuery = useQuery({
    queryKey: tenantQueryKeys.resource(tenant?.slug ?? tenantSlug, 'notification-count'),
    queryFn: tenantWorkspaceApi.notifications.unreadCount,
    enabled: Boolean(tenant)
  });
  const notificationsQuery = useQuery({
    queryKey: tenantQueryKeys.list(tenant?.slug ?? tenantSlug, 'topbar-notifications', { per_page: 6 }),
    queryFn: () => tenantWorkspaceApi.notifications.list({ per_page: 6 }),
    enabled: Boolean(tenant)
  });
  const notificationMutation = useMutation({
    mutationFn: (id: string | number) => tenantWorkspaceApi.notifications.read(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenant?.slug ?? tenantSlug) });
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all('current') });
    }
  });
  const navigation = navigationQuery.data?.data.navigation as { badges?: Record<string, unknown> } | undefined;
  const dynamicBadges = navigation?.badges ?? {};
  const badges = {
    overdueTasks: numberValue(dynamicBadges.overdue_tasks),
    openIssues: numberValue(dynamicBadges.open_issues),
    pendingApprovals: numberValue(dynamicBadges.pending_leave),
    unreadNotifications: numberValue(dynamicBadges.unread_notifications, unreadQuery.data?.data.unread_count ?? 0),
    renewalsDueSoon: numberValue(dynamicBadges.renewals_due_soon)
  };
  const tenantNavigation = buildTenantNavigation(tenantSlug, badges);

  function handleNotificationOpen(notification: { id?: string | number }) {
    if (notification.id === undefined) return;
    navigate(TENANT_ROUTES.notificationDetail(tenantSlug, notification.id));
  }
  async function handleLogout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <AppShell
      sidebar={({ sidebarOpen, toggleSidebar }) => (
        <AppSidebar
          guard="tenant"
          groups={tenantNavigation}
          title="Tenant CRM"
          isCollapsed={!sidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      )}
      topbar={() => (
        <AppTopbar
          title={tenant?.organizationName ?? 'Tenant CRM'}
          locale={locale}
          timezone={timezone}
          notificationCount={badges.unreadNotifications}
          profileName={user?.displayName}
          notifications={notificationsQuery.data?.data ?? []}
          notificationsLoading={notificationsQuery.isLoading}
          onNotificationRead={(id) => notificationMutation.mutate(id)}
          onNotificationOpen={handleNotificationOpen}
          onNotificationsOpen={() => navigate(TENANT_ROUTES.notifications(tenantSlug))}
          onLogout={handleLogout}
          quickActions={
            <>
              <PermissionButton guard="tenant" permission="lead.create" type="button" variant="secondary" size="sm">
                <Plus size={16} aria-hidden />
                Lead
              </PermissionButton>
              <PermissionButton guard="tenant" permission="calendar.create" type="button" variant="secondary" size="sm">
                <CalendarPlus2 size={16} aria-hidden />
                Event
              </PermissionButton>
              <PermissionButton guard="tenant" permission="finance.invoice.create" type="button" variant="secondary" size="sm">
                <ReceiptText size={16} aria-hidden />
                Invoice
              </PermissionButton>
              <PermissionButton guard="tenant" permission="dashboard.view" type="button" size="sm">
                <BellPlus size={16} aria-hidden />
                Quick Actions
              </PermissionButton>
            </>
          }
        />
      )}
    >
      <div className="layout-page-chrome">
        <Outlet />
      </div>
    </AppShell>
  );
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}







