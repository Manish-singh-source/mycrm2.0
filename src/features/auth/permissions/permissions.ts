import type { AuthGuard, AuthState, Permission } from '@/features/auth/types/authTypes';

function normalizePermissionNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item === 'object') {
      const entry = item as { name?: unknown; code?: unknown };
      const name = entry.name ?? entry.code;
      return typeof name === 'string' ? [name] : [];
    }
    return [];
  });
}

export function getGuardPermissions(authState: AuthState, guard: AuthGuard): Permission[] {
  return normalizePermissionNames(guard === 'platform' ? authState.platform.permissions : authState.tenant.permissions);
}

export function hasPermission(
  authState: AuthState,
  guard: AuthGuard,
  permission: Permission
): boolean {
  const session = guard === 'platform' ? authState.platform : authState.tenant;
  const roles = normalizePermissionNames(session.roles);
  if (guard === 'platform' && roles.includes('super_admin')) return true;

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
  const enabledModules = authState.tenant.tenant?.enabledModules ?? [];
  // Older tenant sessions do not include entitlement data. In that case permissions
  // remain the source of access control and modules must not disappear from navigation.
  return enabledModules.length === 0 || enabledModules.includes(moduleCode);
}
