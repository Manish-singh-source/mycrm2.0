import type { PropsWithChildren } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

type RequireAuthProps = PropsWithChildren<{
  guard: AuthGuard;
}>;

export function RequireAuth({ guard, children }: RequireAuthProps) {
  const auth = useAuthStore();
  const location = useLocation();
  const { tenantSlug } = useParams();
  const session = guard === 'platform' ? auth.platform : auth.tenant;

  if (!session.accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location, guard }} />;
  }

  if (guard === 'tenant') {
    const tenant = auth.tenant.tenant;
    const routeTenant = tenantSlug ? decodeURIComponent(tenantSlug) : null;

    if (!tenant || (routeTenant && routeTenant !== tenant.slug && routeTenant !== tenant.uuid)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
}
