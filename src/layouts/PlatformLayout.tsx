import { Outlet } from 'react-router-dom';

import { platformNavigation } from '@/features/platform/navigation/platformNavigation';
import { AppShell } from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';

export function PlatformLayout() {
  return (
    <AppShell sidebar={<AppSidebar guard="platform" groups={platformNavigation} title="Platform Admin" />}>
      <Outlet />
    </AppShell>
  );
}
