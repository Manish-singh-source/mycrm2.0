import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';

type PublicAuthRouteProps = PropsWithChildren<{
  guard?: AuthGuard;
}>;

export function PublicAuthRoute({ guard, children }: PublicAuthRouteProps) {
  const auth = useAuthStore();
  const location = useLocation();
  const requestedGuard = guard ?? location.state?.guard;

  if (requestedGuard === 'tenant' && auth.tenant.status === 'authenticated' && auth.tenant.tenant) {
    return <Navigate to={TENANT_ROUTES.dashboard(auth.tenant.tenant.slug)} replace />;
  }

  if ((!requestedGuard || requestedGuard === 'platform') && auth.platform.status === 'authenticated') {
    return <Navigate to={PLATFORM_ROUTES.dashboard} replace />;
  }

  return <>{children}</>;
}
