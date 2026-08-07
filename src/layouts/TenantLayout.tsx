import { Outlet, useParams } from 'react-router-dom';
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
import { Button } from '@/shared/components/ui';

export function TenantLayout() {
  const { tenantSlug = ':tenantSlug' } = useParams();
  const { user } = useAuth('tenant');
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

  return (
    <AppShell
      sidebar={<AppSidebar guard="tenant" groups={tenantNavigation} title="Tenant CRM" />}
      topbar={({ toggleSidebar }) => (
        <AppTopbar
          title={tenant?.organizationName ?? 'Tenant CRM'}
          locale={locale}
          timezone={timezone}
          notificationCount={badges.unreadNotifications}
          profileName={user?.displayName}
          onToggleSidebar={toggleSidebar}
          quickActions={
            <>
              <Button type="button" variant="secondary" size="sm">
                <Plus size={16} aria-hidden />
                Lead
              </Button>
              <Button type="button" variant="secondary" size="sm">
                <CalendarPlus2 size={16} aria-hidden />
                Event
              </Button>
              <Button type="button" variant="secondary" size="sm">
                <ReceiptText size={16} aria-hidden />
                Invoice
              </Button>
              <Button type="button" size="sm">
                <BellPlus size={16} aria-hidden />
                Quick Actions
              </Button>
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
