import { Outlet, useParams } from 'react-router-dom';

import { buildTenantNavigation } from '@/features/tenant/navigation/tenantNavigation';
import { AppShell } from '@/shared/components/layout';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';

export function TenantLayout() {
  const { tenantSlug = ':tenantSlug' } = useParams();

  return (
    <AppShell sidebar={<AppSidebar guard="tenant" groups={buildTenantNavigation(tenantSlug)} title="Tenant CRM" />}>
      <Outlet />
    </AppShell>
  );
}
