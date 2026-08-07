import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

type RequireAuthProps = PropsWithChildren<{
  guard: AuthGuard;
}>;

export function RequireAuth({ guard, children }: RequireAuthProps) {
  const auth = useAuthStore();
  const location = useLocation();
  const session = guard === 'platform' ? auth.platform : auth.tenant;

  if (!session.accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location, guard }} />;
  }

  return <>{children}</>;
}
