import type { PropsWithChildren, ReactNode } from 'react';

import {
  hasAllPermissions,
  hasAnyPermission
} from '@/features/auth/permissions/permissions';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type PermissionGateProps = PropsWithChildren<{
  guard: AuthGuard;
  allOf?: Permission[];
  anyOf?: Permission[];
  fallback?: ReactNode;
}>;

export function PermissionGate({
  guard,
  allOf = [],
  anyOf = [],
  fallback = null,
  children
}: PermissionGateProps) {
  const auth = useAuthStore();
  const passesAll = allOf.length === 0 || hasAllPermissions(auth, guard, allOf);
  const passesAny = anyOf.length === 0 || hasAnyPermission(auth, guard, anyOf);

  return passesAll && passesAny ? <>{children}</> : <>{fallback}</>;
}
