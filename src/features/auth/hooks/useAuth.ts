import { useCallback } from 'react';

import { authStore, useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';

export function useAuth(guard?: AuthGuard) {
  const auth = useAuthStore();

  const logout = useCallback((targetGuard?: AuthGuard) => {
    authStore.clear(targetGuard ?? guard);
  }, [guard]);

  if (!guard) {
    return {
      auth,
      logout,
      isPlatformAuthenticated: auth.platform.status === 'authenticated',
      isTenantAuthenticated: auth.tenant.status === 'authenticated'
    };
  }

  const session = guard === 'platform' ? auth.platform : auth.tenant;

  return {
    auth,
    session,
    user: session.user,
    roles: session.roles,
    permissions: session.permissions,
    locale: session.locale,
    timezone: session.timezone,
    isAuthenticated: session.status === 'authenticated',
    logout
  };
}
