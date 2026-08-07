import { Outlet, useParams } from 'react-router-dom';

import { buildTenantNavigation } from '@/features/tenant/navigation/tenantNavigation';
import { AppSidebar } from '@/shared/components/navigation/AppSidebar';

export function TenantLayout() {
  const { tenantSlug = ':tenantSlug' } = useParams();

  return (
    <div className="app-shell">
      <AppSidebar guard="tenant" groups={buildTenantNavigation(tenantSlug)} title="Tenant CRM" />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
