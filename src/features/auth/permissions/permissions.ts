import type { AuthGuard, AuthState, Permission } from '@/features/auth/types/authTypes';

export function getGuardPermissions(authState: AuthState, guard: AuthGuard): Permission[] {
  return guard === 'platform' ? authState.platform.permissions : authState.tenant.permissions;
}

export function hasPermission(
  authState: AuthState,
  guard: AuthGuard,
  permission: Permission
): boolean {
  const permissions = getGuardPermissions(authState, guard);
  return permissions.includes('*') || permissions.includes(permission);
}

export function hasAnyPermission(
  authState: AuthState,
  guard: AuthGuard,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(authState, guard, permission));
}

export function hasAllPermissions(
  authState: AuthState,
  guard: AuthGuard,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(authState, guard, permission));
}

export function isModuleEnabled(authState: AuthState, moduleCode: string): boolean {
  return authState.tenant.tenant?.enabledModules.includes(moduleCode) ?? false;
}
