import { Outlet } from 'react-router-dom';

import { platformNavigation } from '@/features/platform/navigation/platformNavigation';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';

export function PlatformLayout() {
  return (
    <div className="app-shell">
      <AppSidebar guard="platform" groups={platformNavigation} title="Platform Admin" />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
