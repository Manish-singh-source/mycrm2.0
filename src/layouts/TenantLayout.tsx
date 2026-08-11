import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { BellPlus, CalendarPlus2, Plus, ReceiptText } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionPreferences } from '@/features/auth/hooks/useSessionPreferences';
import { useTenantContext } from '@/features/auth/hooks/useTenantContext';
import { buildTenantNavigation } from '@/features/tenant/navigation/tenantNavigation';
import {
  AppShell,
  AppTopbar,
  LayoutBreadcrumbs,
  LayoutRouteTitle
} from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';
import { PermissionButton } from '@/shared/components/ui';

export function TenantLayout() {
  const navigate = useNavigate();
  const { tenantSlug = ':tenantSlug' } = useParams();
  const { user, logout } = useAuth('tenant');
  const { locale, timezone } = useSessionPreferences('tenant');
  const { tenant } = useTenantContext();
  const badges = {
    overdueTasks: 6,
    openIssues: 4,
    pendingApprovals: 3,
    unreadNotifications: 8,
    renewalsDueSoon: 5
  };
  const tenantNavigation = buildTenantNavigation(tenantSlug, badges);

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
      topbar={({ toggleSidebar }) => (
        <AppTopbar
          title={tenant?.organizationName ?? 'Tenant CRM'}
          locale={locale}
          timezone={timezone}
          notificationCount={badges.unreadNotifications}
          profileName={user?.displayName}
          onToggleSidebar={toggleSidebar}
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
        <LayoutBreadcrumbs
          rootLabel={tenant?.organizationName ?? 'Tenant'}
          rootTo={`/t/${tenantSlug}/dashboard`}
          groups={tenantNavigation}
        />
        <div className="layout-page-title">
          <LayoutRouteTitle fallback="Tenant Workspace" groups={tenantNavigation} />
        </div>
        <Outlet />
      </div>
    </AppShell>
  );
}
