import { Outlet, useNavigate } from 'react-router-dom';
import { Bolt, Plus, UserPlus } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionPreferences } from '@/features/auth/hooks/useSessionPreferences';
import { platformNavigation } from '@/features/platform/navigation/platformNavigation';
import {
  AppShell,
  AppTopbar,
  LayoutBreadcrumbs,
  LayoutRouteTitle
} from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';
import { PermissionButton } from '@/shared/components/ui';

export function PlatformLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth('platform');
  const { locale, timezone } = useSessionPreferences('platform');

  async function handleLogout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <AppShell
      sidebar={<AppSidebar guard="platform" groups={platformNavigation} title="Platform Admin" />}
      topbar={({ toggleSidebar }) => (
        <AppTopbar
          title="Platform Admin"
          locale={locale}
          timezone={timezone}
          notificationCount={4}
          profileName={user?.displayName}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          quickActions={
            <>
              <PermissionButton guard="platform" permission="tenant.create" type="button" variant="secondary" size="sm">
                <UserPlus size={16} aria-hidden />
                Create Tenant
              </PermissionButton>
              <PermissionButton guard="platform" permission="billing.invoice.create" type="button" variant="secondary" size="sm">
                <Plus size={16} aria-hidden />
                Create Invoice
              </PermissionButton>
              <PermissionButton guard="platform" permission="dashboard.view" type="button" size="sm">
                <Bolt size={16} aria-hidden />
                Quick Actions
              </PermissionButton>
            </>
          }
        />
      )}
    >
      <div className="layout-page-chrome">
        <LayoutBreadcrumbs rootLabel="Platform" rootTo="/platform/dashboard" groups={platformNavigation} />
        <div className="layout-page-title">
          <LayoutRouteTitle fallback="Platform Workspace" groups={platformNavigation} />
        </div>
        <Outlet />
      </div>
    </AppShell>
  );
}
