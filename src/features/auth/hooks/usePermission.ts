import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isModuleEnabled
} from '@/features/auth/permissions/permissions';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

export function usePermission(guard: AuthGuard) {
  const auth = useAuthStore();

  return {
    can: (permission: Permission) => hasPermission(auth, guard, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(auth, guard, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(auth, guard, permissions),
    moduleEnabled: (moduleCode: string) => guard === 'tenant' && isModuleEnabled(auth, moduleCode)
  };
}
