import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { hasAllPermissions, hasAnyPermission } from '@/features/auth/permissions/permissions';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type RequirePermissionProps = PropsWithChildren<{
  guard: AuthGuard;
  allOf?: Permission[];
  anyOf?: Permission[];
}>;

export function RequirePermission({ guard, allOf = [], anyOf = [], children }: RequirePermissionProps) {
  const auth = useAuthStore();
  const passesAll = allOf.length === 0 || hasAllPermissions(auth, guard, allOf);
  const passesAny = anyOf.length === 0 || hasAnyPermission(auth, guard, anyOf);

  if (!passesAll || !passesAny) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
