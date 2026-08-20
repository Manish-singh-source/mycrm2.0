import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionPreferences } from '@/features/auth/hooks/useSessionPreferences';
import { platformNavigation } from '@/features/platform/navigation/platformNavigation';
import {
  AppShell,
  AppTopbar
} from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';

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
      sidebar={({ sidebarOpen, toggleSidebar }) => (
        <AppSidebar
          guard="platform"
          groups={platformNavigation}
          title="SaaS CRM"
          isCollapsed={!sidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      )}
      topbar={() => (
        <AppTopbar
          title="Platform"
          locale={locale}
          timezone={timezone}
          notificationCount={4}
          profileName={user?.displayName}
          onLogout={handleLogout}
        />
      )}
    >
      <div className="layout-page-chrome">
        {/* <LayoutBreadcrumbs rootLabel="Platform" rootTo="/platform/dashboard" groups={platformNavigation} /> */}
        {/* <div className="layout-page-title">
          <LayoutRouteTitle fallback="Platform Workspace" groups={platformNavigation} />
        </div> */}
        <Outlet />
      </div>
    </AppShell>
  );
}
